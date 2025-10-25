import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { examId } = await req.json();
    
    if (!examId) {
      return new Response(
        JSON.stringify({ error: 'examId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[analyze-exam] 🔍 Iniciando análise do exame ${examId}`);
    
    // 1. Buscar dados do exame e seus biomarcadores
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: exam, error: examError } = await supabaseClient
      .from('exams')
      .select('id, exam_date, laboratory, patient_id')
      .eq('id', examId)
      .single();

    if (examError) {
      console.error('[analyze-exam] ❌ Erro ao buscar exame:', examError);
      throw examError;
    }

    const { data: biomarkers, error: biomarkersError } = await supabaseClient
      .from('exam_results')
      .select('*')
      .eq('exam_id', examId)
      .order('biomarker_name', { ascending: true });

    if (biomarkersError) {
      console.error('[analyze-exam] ❌ Erro ao buscar biomarcadores:', biomarkersError);
      throw biomarkersError;
    }

    console.log(`[analyze-exam] 📊 ${biomarkers.length} biomarcadores encontrados`);

    // 2. Buscar histórico do paciente (últimos 5 exames para comparação)
    let historicalExams: any[] = [];
    if (exam.patient_id) {
      const { data: history, error: historyError } = await supabaseClient
        .from('exams')
        .select('id, exam_date, exam_results(*)')
        .eq('patient_id', exam.patient_id)
        .lt('exam_date', exam.exam_date)
        .order('exam_date', { ascending: false })
        .limit(5);

      if (!historyError && history) {
        historicalExams = history;
      }
    }

    console.log(`[analyze-exam] 📅 ${historicalExams.length} exames históricos encontrados`);

    // 3. Montar prompt para Claude Sonnet 4
    const prompt = `Você é um assistente médico especializado em análise de exames laboratoriais. Analise os biomarcadores abaixo e gere insights clínicos detalhados.

**EXAME ATUAL**
Data: ${exam.exam_date}
Laboratório: ${exam.laboratory || 'Não informado'}
Total de biomarcadores: ${biomarkers.length}

**BIOMARCADORES:**
${JSON.stringify(biomarkers.map(b => ({
  nome: b.biomarker_name,
  categoria: b.category,
  valor: b.value,
  unidade: b.unit,
  status: b.status,
  referencia_min: b.reference_min,
  referencia_max: b.reference_max,
  desvio_percentual: b.deviation_percentage
})), null, 2)}

${historicalExams.length > 0 ? `**HISTÓRICO DO PACIENTE (últimos ${historicalExams.length} exames):**
${JSON.stringify(historicalExams.map(h => ({
  data: h.exam_date,
  biomarcadores: h.exam_results?.map((r: any) => ({
    nome: r.biomarker_name,
    valor: r.value,
    status: r.status
  }))
})), null, 2)}` : '**Sem histórico disponível para comparação.**'}

**IMPORTANTE:** Responda APENAS com um JSON válido no seguinte formato:

{
  "clinical_analysis": {
    "resumo_executivo": "Resumo geral do estado de saúde em 2-3 frases",
    "areas_atencao": ["Área 1 que precisa atenção", "Área 2 que precisa atenção"],
    "correlacoes_importantes": [
      {
        "exames_relacionados": ["Biomarcador 1", "Biomarcador 2"],
        "interpretacao": "Explicação da correlação",
        "relevancia_clinica": "alta"
      }
    ],
    "score_saude_geral": 85,
    "categoria_risco": "baixo"
  },
  "alerts": [
    {
      "tipo": "crítico",
      "exame": "Nome do biomarcador",
      "mensagem": "Descrição do alerta",
      "acao_sugerida": "Ação recomendada"
    }
  ],
  "trends": {
    "melhorias": ["Biomarcador X melhorou em relação ao histórico"],
    "pioras": ["Biomarcador Y piorou em relação ao histórico"],
    "estavel": ["Biomarcador Z permanece estável"]
  },
  "recommendations": [
    {
      "categoria": "consulta",
      "prioridade": "alta",
      "descricao": "Descrição da recomendação"
    }
  ]
}

**CRITÉRIOS:**
- score_saude_geral: 0-100 (quanto maior, melhor)
- categoria_risco: "baixo", "moderado", "alto", "crítico"
- tipo de alerta: "crítico", "urgente", "atenção", "informativo"
- relevancia_clinica: "baixa", "média", "alta"
- categoria de recomendação: "consulta", "estilo_vida", "medicacao", "novo_exame", "monitoramento"
- prioridade: "baixa", "média", "alta", "urgente"`;

    // 4. Chamar Claude via Anthropic API
    console.log('[analyze-exam] 🤖 Chamando Claude Sonnet 4...');
    
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        temperature: 1.0,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('[analyze-exam] ❌ Erro na API Anthropic:', errorText);
      throw new Error(`Anthropic API error: ${anthropicResponse.status} - ${errorText}`);
    }

    const aiResult = await anthropicResponse.json();
    console.log('[analyze-exam] ✅ Resposta recebida do Claude');
    
    // Extrair JSON da resposta
    let analysisData;
    try {
      const content = aiResult.content[0].text;
      // Tentar extrair JSON de markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      analysisData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[analyze-exam] ❌ Erro ao parsear JSON:', parseError);
      throw new Error('Falha ao parsear resposta do Claude');
    }

    // 5. Atualizar banco com insights
    console.log('[analyze-exam] 💾 Salvando insights no banco...');
    
    const { error: updateError } = await supabaseClient
      .from('exams')
      .update({
        clinical_analysis: analysisData.clinical_analysis,
        alerts: analysisData.alerts || [],
        trends: analysisData.trends || {},
        recommendations: analysisData.recommendations || [],
        health_score: analysisData.clinical_analysis?.score_saude_geral || null,
        risk_category: analysisData.clinical_analysis?.categoria_risco || null,
      })
      .eq('id', examId);

    if (updateError) {
      console.error('[analyze-exam] ❌ Erro ao atualizar exame:', updateError);
      throw updateError;
    }

    console.log('[analyze-exam] ✅ Análise concluída com sucesso!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: analysisData,
        biomarkers_count: biomarkers.length,
        historical_exams: historicalExams.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[analyze-exam] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
