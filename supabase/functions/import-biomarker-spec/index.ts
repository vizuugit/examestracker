import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BiomarkerSpec {
  versao: string;
  data_atualizacao: string;
  descricao: string;
  total_categorias: number;
  total_biomarcadores: number;
  categorias: Array<{
    id: string;
    nome: string;
    ordem: number;
    biomarcadores: string[];
  }>;
  biomarcadores: Array<{
    nome_padrao: string;
    categoria: string;
    category_id: string;
    category_order: number;
    biomarker_order: number;
    sinonimos: string[];
  }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[import-biomarker-spec] Iniciando importação...');

    // Receber o JSON do request body
    const { spec } = await req.json();
    
    if (!spec) {
      throw new Error('Especificação de biomarcadores não fornecida no request');
    }

    console.log(`[import-biomarker-spec] Arquivo carregado: ${spec.versao} (${spec.data_atualizacao})`);
    console.log(`[import-biomarker-spec] Categorias: ${spec.total_categorias}, Biomarcadores: ${spec.total_biomarcadores}`);

    // Limpar tabelas existentes
    console.log('[import-biomarker-spec] Limpando tabelas existentes...');
    
    const { error: deleteOverridesError } = await supabase
      .from('biomarker_category_overrides')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteOverridesError) throw deleteOverridesError;

    const { error: deleteOrderError } = await supabase
      .from('category_display_order')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteOrderError) throw deleteOrderError;

    const { error: deleteVariationsError } = await supabase
      .from('biomarker_variations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteVariationsError) throw deleteVariationsError;

    console.log('[import-biomarker-spec] Tabelas limpas com sucesso');

    // Importar category_display_order
    console.log('[import-biomarker-spec] Importando ordem de categorias...');
    const categoryOrders = spec.categorias.map((cat: any) => ({
      category_key: cat.nome,
      display_order: cat.ordem,
    }));

    const { error: orderError } = await supabase
      .from('category_display_order')
      .insert(categoryOrders);
    
    if (orderError) throw orderError;
    console.log(`[import-biomarker-spec] ${categoryOrders.length} categorias importadas`);

    // Importar biomarker_category_overrides
    console.log('[import-biomarker-spec] Importando overrides de biomarcadores...');
    const overrides = spec.biomarcadores.map((bio: any) => ({
      biomarker_name: bio.nome_padrao,
      category: bio.categoria,
      display_order: bio.biomarker_order,
    }));

    const { error: overridesError } = await supabase
      .from('biomarker_category_overrides')
      .insert(overrides);
    
    if (overridesError) throw overridesError;
    console.log(`[import-biomarker-spec] ${overrides.length} overrides importados`);

    // Importar biomarker_variations
    console.log('[import-biomarker-spec] Importando variações de biomarcadores...');
    const variations: Array<{
      biomarker_normalized_name: string;
      variation: string;
      category: string;
    }> = [];

    for (const bio of spec.biomarcadores) {
      for (const sinonimo of bio.sinonimos) {
        const trimmed = sinonimo.trim();
        const trimmedNomePadrao = bio.nome_padrao.trim();
        // Evitar duplicatas (sinônimo = nome padrão, ignorando espaços)
        if (trimmed !== trimmedNomePadrao) {
          variations.push({
            biomarker_normalized_name: bio.nome_padrao,
            // Constraint exige variação em minúsculas
            variation: trimmed.toLowerCase(),
            category: bio.categoria,
          });
        }
      }
    }

    // Inserir em lotes de 100 para evitar timeout
    const batchSize = 100;
    for (let i = 0; i < variations.length; i += batchSize) {
      const batch = variations.slice(i, i + batchSize);
      const { error: variationsError } = await supabase
        .from('biomarker_variations')
        .insert(batch);
      
      if (variationsError) throw variationsError;
      console.log(`[import-biomarker-spec] Variações ${i + 1}-${Math.min(i + batchSize, variations.length)} de ${variations.length} importadas`);
    }

    console.log(`[import-biomarker-spec] Total: ${variations.length} variações importadas`);

    const summary = {
      success: true,
      version: spec.versao,
      date: spec.data_atualizacao,
      stats: {
        categories: categoryOrders.length,
        overrides: overrides.length,
        variations: variations.length,
      },
    };

    console.log('[import-biomarker-spec] Importação concluída com sucesso:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[import-biomarker-spec] Erro durante importação:', error);

    let errorMessage = 'Erro desconhecido';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      if ('message' in error) {
        errorMessage = String((error as any).message);
      } else if ('code' in error) {
        errorMessage = `Erro de banco de dados: ${(error as any).code}`;
      } else {
        try {
          errorMessage = JSON.stringify(error);
        } catch {
          errorMessage = 'Erro ao serializar erro';
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
