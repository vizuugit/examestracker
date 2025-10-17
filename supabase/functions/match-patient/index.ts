import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchRequest {
  extractedName: string;
  professionalId: string;
}

interface PatientCandidate {
  id: string;
  full_name: string;
  similarity: number;
}

// Função para normalizar strings (remover acentos, pontuação, espaços extras)
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, '') // Remove pontuação
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}

// Calcula similaridade usando Levenshtein distance
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calcula score de similaridade (0-100%)
function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalize(str1);
  const normalized2 = normalize(str2);
  
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  if (maxLength === 0) return 100;
  
  return ((1 - distance / maxLength) * 100);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { extractedName, professionalId }: MatchRequest = await req.json();

    console.log('🔍 Matching patient:', { extractedName, professionalId });

    // Buscar todos os pacientes do profissional
    const { data: patients, error: fetchError } = await supabase
      .from('patients')
      .select('id, full_name')
      .eq('professional_id', professionalId);

    if (fetchError) {
      throw fetchError;
    }

    if (!patients || patients.length === 0) {
      console.log('📭 No patients found - will create new');
      return new Response(
        JSON.stringify({
          action: 'create',
          extractedName,
          message: 'Nenhum paciente cadastrado. Será criado automaticamente.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular similaridade para cada paciente
    const candidates: PatientCandidate[] = patients
      .map(patient => ({
        id: patient.id,
        full_name: patient.full_name,
        similarity: calculateSimilarity(extractedName, patient.full_name),
      }))
      .filter(candidate => candidate.similarity >= 70) // Threshold de 70%
      .sort((a, b) => b.similarity - a.similarity);

    console.log('🎯 Candidates found:', candidates.length);

    // Nenhum candidato com similaridade >= 70%
    if (candidates.length === 0) {
      console.log('🆕 No similar patients - will create new');
      return new Response(
        JSON.stringify({
          action: 'create',
          extractedName,
          message: 'Nenhum paciente similar encontrado. Será criado automaticamente.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Match exato (>= 95% de similaridade)
    if (candidates[0].similarity >= 95) {
      console.log('✅ Exact match found:', candidates[0].full_name);
      return new Response(
        JSON.stringify({
          action: 'exact_match',
          patientId: candidates[0].id,
          patientName: candidates[0].full_name,
          similarity: candidates[0].similarity,
          message: `Match automático: ${candidates[0].full_name}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Múltiplos candidatos ou match parcial
    console.log('🤔 Multiple candidates - user selection required');
    return new Response(
      JSON.stringify({
        action: 'select',
        candidates: candidates.slice(0, 5), // Top 5
        extractedName,
        message: 'Selecione o paciente correto ou crie um novo.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error matching patient:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
