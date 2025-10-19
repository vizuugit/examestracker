import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aws-proxy`;

interface UploadOptions {
  patientId: string;
  file: File;
  examDate?: Date;
  onComplete?: () => void;
}

interface AWSExamData {
  status: string;
  data: {
    dados_basicos: {
      laboratorio: string;
      paciente: string;
      data_exame: string;
      medico_solicitante: string | null;
    };
    exames: Array<{
      nome: string;
      categoria: string;
      resultado: string;
      unidade: string;
      referencia_min: number | null;
      referencia_max: number | null;
      status: string;
      desvio_percentual: number | null;
      observacao: string | null;
      explicacao_leiga: string;
      possiveis_causas_alteracao: string[] | null;
    }>;
    analise_clinica: {
      resumo_executivo: string;
      areas_atencao: string[];
      score_saude_geral: number;
      categoria_risco: string;
    };
    alertas: Array<{
      tipo: string;
      exame: string;
      mensagem: string;
      acao_sugerida: string;
    }>;
    tendencias: {
      melhorias: string[];
      pioras: string[];
      estavel: string[];
    };
    recomendacoes: Array<{
      categoria: string;
      prioridade: string;
      descricao: string;
    }>;
    metadata: {
      total_exames: number;
      exames_normais: number;
      exames_alterados: number;
      exames_criticos: number;
    };
  };
  processedAt: string | null;
  s3Key: string;
}

export function useExamUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  // Método original (manual)
  const uploadExam = async ({ patientId, file, examDate, onComplete }: UploadOptions) => {
    try {
      setUploading(true);
      setProgress(10);
      setStatus("Preparando upload...");

      // 1. Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 2. Detectar Content-Type correto (case-insensitive)
      const fileExtension = file.name.toLowerCase().split('.').pop() || '';
      let contentType = file.type;

      if (!contentType || contentType === 'application/octet-stream') {
        const typeMap: Record<string, string> = {
          'pdf': 'application/pdf',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'heic': 'image/heic',
          'heif': 'image/heif',
        };
        contentType = typeMap[fileExtension] || 'application/octet-stream';
      }

      console.log(`[Upload] Arquivo: ${file.name} | Ext: ${fileExtension} | Content-Type: ${contentType}`);

      // 3. Get upload URL from Edge Function (proxy to AWS)
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          action: "getUploadUrl",
          userId: patientId,
          fileName: file.name,
          contentType: contentType,
        }),
      });

      if (!response.ok) throw new Error("Erro ao gerar URL de upload");

      const { uploadUrl, s3Key, contentType: awsContentType } = await response.json();
      setProgress(20);

      // 4. Create exam record in Supabase (status: uploading)
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .insert({
          patient_id: patientId,
          uploaded_by: user.id,
          aws_file_key: s3Key,
          aws_file_name: file.name,
          exam_date: examDate?.toISOString().split("T")[0],
          processing_status: "uploading",
        })
        .select()
        .single();

      if (examError) throw examError;
      setProgress(30);

      // 5. Upload para S3 com Content-Type retornado pela AWS
      setStatus("Enviando arquivo...");
      console.log(`[Upload] Enviando ${file.name} com Content-Type da AWS: ${awsContentType}`);

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": awsContentType },
      });

      if (!uploadResponse.ok) {
        console.error('[Upload] Erro no upload S3:', uploadResponse.status, uploadResponse.statusText);
        // Marcar exame como erro
        await supabase
          .from("exams")
          .update({ processing_status: "error" })
          .eq("id", exam.id);
        throw new Error("Erro no upload do arquivo");
      }
      console.log('[Upload] ✅ Upload S3 bem-sucedido');
      setProgress(50);

      // 6. Update status to 'processing'
      await supabase
        .from("exams")
        .update({ processing_status: "processing" })
        .eq("id", exam.id);

      // 7. Start polling
      setStatus("Processando com IA...");
      await pollExamStatus(patientId, s3Key, exam.id);

      setProgress(100);
      setStatus("Concluído!");
      toast.success("Exame processado com sucesso!", {
        description: `Exame analisado com sucesso`,
      });

      // Callback para notificar componentes externos
      onComplete?.();

      return exam;
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro no processamento", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const pollExamStatus = async (userId: string, s3Key: string, examId: string) => {
    const maxAttempts = 100; // 100 tentativas x 3 segundos = 300 segundos (5 minutos)
    let attempts = 0;
    const startTime = Date.now();

    return new Promise<void>((resolve, reject) => {
      const interval = setInterval(async () => {
        attempts++;
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        setProgress(50 + (attempts / maxAttempts) * 40); // 50% -> 90%

        // Mensagens progressivas com tempo
        if (elapsedSeconds < 30) {
          setStatus(`Processando com IA... (${elapsedSeconds}s)`);
        } else if (elapsedSeconds < 60) {
          setStatus(`Processando com IA... (${Math.floor(elapsedSeconds / 60)}min ${elapsedSeconds % 60}s)`);
        } else if (elapsedSeconds < 120) {
          setStatus(`Processando com IA... (${Math.floor(elapsedSeconds / 60)}min - quase lá)`);
        } else {
          setStatus(`Processando com IA... (${Math.floor(elapsedSeconds / 60)}min - aguarde mais um pouco)`);
        }

        try {
          // Fetch status from Edge Function (proxy to AWS)
          console.log(`[Polling] Tentativa ${attempts}/${maxAttempts} (${elapsedSeconds}s) - Verificando status para s3Key: ${s3Key}`);
          
          const response = await fetch(`${EDGE_FUNCTION_URL}?userId=${userId}&s3Key=${encodeURIComponent(s3Key)}`, {
            headers: {
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            }
          });
          if (!response.ok) throw new Error("Erro ao verificar status");

          const data = await response.json();
          console.log(`[Polling] Resposta AWS:`, data);

          // Se retornou status diretamente (novo formato)
          if (data.status) {
            if (data.status === 'completed' && data.data) {
              console.log(`[Polling] ✅ Processamento concluído após ${elapsedSeconds}s!`);
              clearInterval(interval);
              await syncExamToSupabase(examId, data);
              resolve();
              return;
            } else if (data.status === 'processing') {
              console.log(`[Polling] ⏳ Ainda processando...`);
              // Continua o loop
            }
          } else {
            // Formato antigo (fallback)
            console.warn('[Polling] Formato de resposta legado - migre para novo formato');
          }

          // Timeout check
          if (attempts >= maxAttempts) {
            // Timeout após 3 minutos
            console.error(`[Polling] ⏱️ Timeout após ${elapsedSeconds}s (${maxAttempts} tentativas)`);
            clearInterval(interval);
            await supabase
              .from("exams")
              .update({ processing_status: "error" })
              .eq("id", examId);
            reject(new Error(`Timeout no processamento (${Math.floor(elapsedSeconds / 60)}min). O processamento está demorando mais que o esperado.`));
          }
        } catch (error) {
          console.error(`[Polling] Erro na tentativa ${attempts}:`, error);
          clearInterval(interval);
          reject(error);
        }
      }, 3000); // Poll every 3 seconds
    });
  };

  const syncExamToSupabase = async (examId: string, awsResponse: AWSExamData) => {
    console.log('[Sync] 1. Estrutura completa:', JSON.stringify(awsResponse, null, 2).substring(0, 500));
    
    const awsData = awsResponse.data;
    console.log('[Sync] 2. awsData existe?', !!awsData);
    console.log('[Sync] 3. dados_basicos existe?', !!(awsData && awsData.dados_basicos));
    
    // VALIDAÇÃO CRÍTICA
    if (!awsData) {
      throw new Error('❌ awsResponse.data está undefined');
    }
    
    if (!awsData.dados_basicos) {
      console.error('[Sync] ❌ Estrutura inválida! awsData:', JSON.stringify(awsData).substring(0, 500));
      throw new Error('❌ awsData.dados_basicos está undefined');
    }
    
    console.log('[Sync] 4. laboratorio:', awsData.dados_basicos.laboratorio);
    console.log('[Sync] 5. paciente:', awsData.dados_basicos.paciente);
    
    // Update exam with AWS data
    const { error: updateError } = await supabase
      .from("exams")
      .update({
        processing_status: "completed",
        processed_at: awsResponse.processedAt || new Date().toISOString(),
        laboratory: awsData.dados_basicos.laboratorio || '',
        patient_name_extracted: awsData.dados_basicos.paciente || '',
        total_biomarkers: awsData.metadata?.total_exames || 0,
        raw_aws_response: awsData as any,
        clinical_analysis: awsData.analise_clinica || null,
        alerts: awsData.alertas || [],
        trends: awsData.tendencias || {},
        recommendations: awsData.recomendacoes || [],
        health_score: awsData.analise_clinica?.score_saude_geral || null,
        risk_category: awsData.analise_clinica?.categoria_risco || null,
      })
      .eq("id", examId);

    if (updateError) throw updateError;

    // Insert biomarkers (se existirem)
    if (awsData.exames && awsData.exames.length > 0) {
      const biomarkers = awsData.exames.map((b) => ({
        exam_id: examId,
        biomarker_name: b.nome,
        category: b.categoria,
        value: b.resultado,
        value_numeric: parseFloat(b.resultado) || null,
        unit: b.unidade,
        reference_min: b.referencia_min,
        reference_max: b.referencia_max,
        status: b.status as "normal" | "alto" | "baixo" | "alterado",
        observation: b.observacao || null,
        deviation_percentage: b.desvio_percentual,
        layman_explanation: b.explicacao_leiga,
        possible_causes: b.possiveis_causas_alteracao,
      }));

      const { error: biomarkersError } = await supabase
        .from("exam_results")
        .insert(biomarkers);

      if (biomarkersError) throw biomarkersError;
    }
  };

  // Método com auto-matching
  const uploadExamWithAutoMatching = async ({ 
    file, 
    examDate, 
    onComplete,
    onMatchRequired,
  }: {
    file: File;
    examDate?: Date;
    onComplete?: () => void;
    onMatchRequired?: (extractedName: string, candidates: any[], examId: string) => void;
  }) => {
    try {
      setUploading(true);
      setProgress(10);
      setStatus("Preparando upload...");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Detectar Content-Type correto (case-insensitive)
      const fileExtension = file.name.toLowerCase().split('.').pop() || '';
      let contentType = file.type;

      if (!contentType || contentType === 'application/octet-stream') {
        const typeMap: Record<string, string> = {
          'pdf': 'application/pdf',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'heic': 'image/heic',
          'heif': 'image/heif',
        };
        contentType = typeMap[fileExtension] || 'application/octet-stream';
      }

      console.log(`[AutoMatch] Arquivo: ${file.name} | Ext: ${fileExtension} | Content-Type: ${contentType}`);

      // 2. Get upload URL
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          action: "getUploadUrl",
          userId: "temp", // Temporário
          fileName: file.name,
          contentType: contentType,
        }),
      });

      if (!response.ok) throw new Error("Erro ao gerar URL de upload");
      const { uploadUrl, s3Key, contentType: awsContentType } = await response.json();
      setProgress(20);

      // 3. Create exam without patient_id (será preenchido depois)
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .insert({
          patient_id: null, // NULL temporariamente
          uploaded_by: user.id,
          aws_file_key: s3Key,
          aws_file_name: file.name,
          exam_date: examDate?.toISOString().split("T")[0],
          processing_status: "uploading",
        })
        .select()
        .single();

      if (examError) throw examError;
      setProgress(30);

      // 4. Upload para S3 com Content-Type retornado pela AWS
      setStatus("Enviando arquivo...");
      console.log(`[AutoMatch] Enviando ${file.name} com Content-Type da AWS: ${awsContentType}`);

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": awsContentType },
      });

      if (!uploadResponse.ok) {
        console.error('[AutoMatch] Erro no upload S3:', uploadResponse.status, uploadResponse.statusText);
        await supabase
          .from("exams")
          .update({ processing_status: "error" })
          .eq("id", exam.id);
        throw new Error("Erro no upload do arquivo");
      }
      console.log('[AutoMatch] ✅ Upload S3 bem-sucedido');
      setProgress(50);

      // 5. Update to processing
      await supabase
        .from("exams")
        .update({ processing_status: "processing" })
        .eq("id", exam.id);

      // 6. Poll AWS até ter o nome do paciente extraído
      setStatus("Processando com IA...");
      await pollExamStatus("temp", s3Key, exam.id);

      // 7. Buscar dados processados
      const { data: processedExam } = await supabase
        .from("exams")
        .select("patient_name_extracted")
        .eq("id", exam.id)
        .single();

      if (!processedExam?.patient_name_extracted) {
        throw new Error("Nome do paciente não foi extraído");
      }

      setProgress(70);
      setStatus("Buscando paciente...");

      // 8. Chamar edge function de matching
      const matchResponse = await supabase.functions.invoke('match-patient', {
        body: {
          extractedName: processedExam.patient_name_extracted,
          professionalId: user.id,
        },
      });

      if (matchResponse.error) throw matchResponse.error;

      const matchResult = matchResponse.data;
      setProgress(80);

      // 9. Processar resultado do matching
      if (matchResult.action === 'exact_match') {
        // Match automático - atualizar exame
        await supabase
          .from("exams")
          .update({ 
            patient_id: matchResult.patientId,
            matching_type: 'auto_exact',
          })
          .eq("id", exam.id);

        setProgress(100);
        toast.success("Exame processado com sucesso!", {
          description: `Paciente: ${matchResult.patientName}`,
        });
        onComplete?.();

      } else if (matchResult.action === 'create') {
        // Criar novo paciente
        const { data: newPatient, error: createError } = await supabase
          .from("patients")
          .insert({
            full_name: matchResult.extractedName,
            professional_id: user.id,
          })
          .select()
          .single();

        if (createError) throw createError;

        await supabase
          .from("exams")
          .update({ 
            patient_id: newPatient.id,
            matching_type: 'auto_created',
          })
          .eq("id", exam.id);

        setProgress(100);
        toast.success("Novo paciente criado!", {
          description: `Paciente: ${matchResult.extractedName}`,
        });
        onComplete?.();

      } else if (matchResult.action === 'select') {
        // Múltiplos candidatos - precisa intervenção do usuário
        setProgress(90);
        setStatus("Aguardando seleção...");
        onMatchRequired?.(matchResult.extractedName, matchResult.candidates, exam.id);
      }

      return exam;

    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro no processamento", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadExam,
    uploadExamWithAutoMatching,
    uploading,
    progress,
    status,
  };
}
