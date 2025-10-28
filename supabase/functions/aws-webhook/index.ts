import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Deduplicate exams utility
function normalizeExamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/\b(de|da|do|das|dos|e|para|em|com|a|o)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateExamCompleteness(exam: any): number {
  let score = 0;
  if (exam.resultado) score += 10;
  if (exam.unidade) score += 5;
  if (exam.valor_referencia_min !== null) score += 5;
  if (exam.valor_referencia_max !== null) score += 5;
  if (exam.observacao) score += 3;
  if (exam.explicacao_leiga) score += 2;
  return score;
}

function deduplicateExams(exams: any[]): any[] {
  const examMap = new Map<string, any>();
  
  exams.forEach(exam => {
    const normalizedName = normalizeExamName(exam.nome);
    const existing = examMap.get(normalizedName);
    
    if (!existing) {
      examMap.set(normalizedName, exam);
    } else {
      const existingScore = calculateExamCompleteness(existing);
      const newScore = calculateExamCompleteness(exam);
      
      if (newScore > existingScore) {
        examMap.set(normalizedName, exam);
      }
    }
  });
  
  return Array.from(examMap.values());
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AWS webhook received');
    
    const payload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    // Validate payload structure
    if (!payload.examId || !payload.s3Key || !payload.status) {
      console.error('Invalid payload structure:', payload);
      return new Response(
        JSON.stringify({ error: 'Missing required fields: examId, s3Key, status' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { examId, s3Key, status, data, processedAt, filename } = payload;

    // Define background task
    const backgroundTask = async () => {
      try {
        console.log(`Processing webhook for exam ${examId} (filename: ${filename || 'not provided'}) with status ${status}`);

        if (status === 'failed') {
          // Update exam status to failed
          const { error: updateError } = await supabase
            .from('exams')
            .update({
              processing_status: 'failed',
              processed_at: processedAt || new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', examId);

          if (updateError) {
            console.error('Error updating failed exam:', updateError);
          } else {
            console.log(`Exam ${examId} marked as failed`);
          }
          return;
        }

        if (status === 'completed' && data) {
          console.log('Processing completed exam data');

          // Extract data from AWS response
          const dadosBasicos = data.dados_basicos || {};
          const exames = data.exames || [];
          const analiseClin = data.analise_clinica || {};
          const alertas = data.alertas || [];
          const tendencias = data.tendencias || {};
          const recomendacoes = data.recomendacoes || [];

          // Helper function to parse Brazilian date format (dd/mm/yyyy)
          const parseBrazilianDate = (dateStr: string | null): string | null => {
            if (!dateStr) return null;
            
            // Try dd/mm/yyyy format
            const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (match) {
              const [, day, month, year] = match;
              return `${year}-${month}-${day}`; // Return ISO format
            }
            
            // If already in ISO format or other format, return as is
            return dateStr;
          };

          // Update exam record
          const examUpdate = {
            processing_status: 'completed',
            processed_at: processedAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            laboratory: dadosBasicos.laboratorio || null,
            exam_date: dadosBasicos.data_exame || null,
            birth_date: parseBrazilianDate(dadosBasicos.data_nascimento) || null,
            patient_name_extracted: dadosBasicos.paciente || null,
            health_score: analiseClin.score_saude || null,
            risk_category: analiseClin.categoria_risco || null,
            total_biomarkers: exames.length || 0,
            alerts: alertas.length > 0 ? alertas : null,
            trends: Object.keys(tendencias).length > 0 ? tendencias : null,
            recommendations: recomendacoes.length > 0 ? recomendacoes : null,
            clinical_analysis: Object.keys(analiseClin).length > 0 ? analiseClin : null,
            raw_aws_response: data
          };

          const { error: examError } = await supabase
            .from('exams')
            .update(examUpdate)
            .eq('id', examId);

          if (examError) {
            console.error('Error updating exam:', examError);
            throw examError;
          }

          console.log(`Exam ${examId} updated successfully`);

          // Process exam results (biomarkers)
          if (exames.length > 0) {
            console.log(`Processing ${exames.length} biomarkers`);

            // Deduplicate exams
            const deduplicatedExams = deduplicateExams(exames);
            console.log(`After deduplication: ${deduplicatedExams.length} biomarkers`);

            // Helper function to parse reference ranges
            const parseReferenceRange = (referenceStr: string | null) => {
              if (!referenceStr) return { min: null, max: null };
              
              // Pattern: "70-100" or "70 - 100" or "70 a 100"
              const rangeMatch = referenceStr.match(/(\d+(?:\.\d+)?)\s*[-a]\s*(\d+(?:\.\d+)?)/);
              if (rangeMatch) {
                return {
                  min: parseFloat(rangeMatch[1]),
                  max: parseFloat(rangeMatch[2])
                };
              }
              
              // Pattern: "<100" or "< 100"
              const maxOnlyMatch = referenceStr.match(/[<≤]\s*(\d+(?:\.\d+)?)/);
              if (maxOnlyMatch) {
                return {
                  min: null,
                  max: parseFloat(maxOnlyMatch[1])
                };
              }
              
              // Pattern: ">70" or "> 70"
              const minOnlyMatch = referenceStr.match(/[>≥]\s*(\d+(?:\.\d+)?)/);
              if (minOnlyMatch) {
                return {
                  min: parseFloat(minOnlyMatch[1]),
                  max: null
                };
              }
              
              return { min: null, max: null };
            };

            // Transform to exam_results format
            const examResults = deduplicatedExams.map((exam: any) => {
              // Try to parse reference values if not already provided
              let refMin = exam.valor_referencia_min;
              let refMax = exam.valor_referencia_max;
              
              if ((refMin === null || refMax === null) && exam.referencia) {
                const parsed = parseReferenceRange(exam.referencia);
                refMin = refMin || parsed.min;
                refMax = refMax || parsed.max;
              }
              
              return {
                exam_id: examId,
                biomarker_name: exam.nome,
                category: exam.categoria || null,
                value: exam.resultado || '',
                value_numeric: exam.valor_numerico || null,
                unit: exam.unidade || null,
                reference_min: refMin,
                reference_max: refMax,
                status: exam.status || 'normal',
                deviation_percentage: exam.percentual_desvio || null,
                observation: exam.observacao || null,
                layman_explanation: exam.explicacao_leiga || null,
                possible_causes: exam.causas_possiveis || null
              };
            });

            // Delete existing results for this exam
            const { error: deleteError } = await supabase
              .from('exam_results')
              .delete()
              .eq('exam_id', examId);

            if (deleteError) {
              console.error('Error deleting old exam results:', deleteError);
            }

            // Insert new results
            const { error: insertError } = await supabase
              .from('exam_results')
              .insert(examResults);

            if (insertError) {
              console.error('Error inserting exam results:', insertError);
              throw insertError;
            }

            console.log(`${examResults.length} exam results inserted successfully`);
          }
        }

        console.log(`Webhook processing completed for exam ${examId}`);
      } catch (error) {
        console.error('Error in background task:', error);
        // Don't throw - we already returned 200 to AWS
      }
    };

    // Start background task (fire and forget)
    backgroundTask().catch(err => {
      console.error('Background task failed:', err);
    });

    // Return immediate response to AWS
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook received and processing started',
        examId 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in aws-webhook function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
