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

export interface FileQueueItem {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  statusMessage: string;
  examId?: string;
  patientId?: string;
  error?: string;
}

interface AWSExamData {
  status: string;
  data: {
    // Formato novo (com dados_basicos aninhado)
    dados_basicos?: {
      laboratorio: string;
      paciente: string;
      data_exame: string;
      medico_solicitante: string | null;
    };
    // Formato antigo (campos diretos)
    laboratorio?: string;
    paciente?: string;
    data_exame?: string;
    medico_solicitante?: string | null;
    total_exames?: number;
    
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
      nome_original?: string;
      confianca_normalizacao?: number;
      tipo_normalizacao?: string;
    }>;
    
    metadata?: {
      total_exames: number;
      exames_normais: number;
      exames_alterados: number;
      exames_criticos: number;
    };
    
    biomarcadores_rejeitados?: Array<{
      nome_original: string;
      valor_original: string;
      motivo: string;
      motivo_rejeicao?: string;
      sugestoes?: string[];
      similaridade?: number;
    }>;
  };
  processedAt: string | null;
  s3Key: string;
}

export function useExamUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  // Função para sanitizar nomes de arquivo
  const sanitizeFileName = (fileName: string): string => {
    return fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w.-]/g, '_')         // Substitui caracteres especiais por _
      .replace(/\s+/g, '_')             // Substitui espaços por _
      .replace(/_+/g, '_')              // Remove underscores duplos
      .toLowerCase();                   // Tudo minúsculo
  };

  // Método original (manual)
  const uploadExam = async ({ 
    patientId, 
    file, 
    examDate, 
    onComplete,
    onStatusUpdate,
  }: UploadOptions & {
    onStatusUpdate?: (message: string, progress: number, status?: FileQueueItem['status']) => void;
  }) => {
    try {
      setUploading(true);
      setProgress(10);
      setStatus("Preparando upload...");
      onStatusUpdate?.("Preparando upload...", 10);

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

      // 3. Sanitizar nome do arquivo
      const sanitizedFileName = sanitizeFileName(file.name);
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '-');
      const finalFileName = `${timestamp}-${sanitizedFileName}`;

      console.log(`[Upload] Arquivo original: ${file.name}`);
      console.log(`[Upload] Arquivo sanitizado: ${finalFileName}`);
      console.log(`[Upload] Content-Type: ${contentType}`);

      // 4. Get upload URL from Edge Function (proxy to AWS)
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          action: "getUploadUrl",
          userId: patientId,
          fileName: finalFileName,
          contentType: contentType,
        }),
      });

      if (!response.ok) throw new Error("Erro ao gerar URL de upload");

      const { uploadUrl, s3Key, contentType: awsContentType } = await response.json();
      setProgress(20);

      // 5. Create exam record in Supabase (status: uploading)
      // ✅ Deixar o Supabase gerar o UUID automaticamente
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .insert({
          patient_id: patientId,
          uploaded_by: user.id,
          aws_file_key: s3Key,
          aws_file_name: finalFileName,
          exam_date: examDate?.toISOString().split("T")[0],
          processing_status: "uploading",
        })
        .select()
        .single();
      
      if (examError) throw examError;
      
      console.log(`[Upload] ✅ Exame criado com UUID: ${exam.id}`);

      setProgress(30);

      // 6. Upload para S3 com Content-Type retornado pela AWS
      setStatus("Enviando arquivo...");
      onStatusUpdate?.("Enviando arquivo...", 30);
      console.log(`[Upload] Enviando ${finalFileName} com Content-Type da AWS: ${awsContentType}`);

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

      // 7. Update status to 'processing'
      await supabase
        .from("exams")
        .update({ processing_status: "processing" })
        .eq("id", exam.id);

      // 8. Start polling
      setStatus("Processando com IA...");
      onStatusUpdate?.("Processando com IA...", 50, 'processing');
      await pollExamStatus(patientId, s3Key, exam.id, onStatusUpdate);

      setProgress(100);
      setStatus("Concluído!");
      onStatusUpdate?.("Concluído!", 100);
      toast.success("Exame processado com sucesso!", {
        description: `Exame analisado com sucesso`,
      });

      // Callback para notificar componentes externos
      onComplete?.();

      return exam;
    } catch (error: any) {
      console.error("Erro no upload:", error);
      
      // Identificar tipo de erro
      let errorMessage = 'Erro no processamento';
      let errorDetails = '';
      
      if (error.message?.includes('NoSuchKey') || error.message?.includes('InvalidS3ObjectException')) {
        errorMessage = 'Erro ao acessar arquivo no servidor';
        errorDetails = 'O arquivo pode ter caracteres especiais no nome. Tente renomeá-lo e fazer upload novamente.';
      } else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        errorMessage = 'Processamento em andamento';
        errorDetails = 'O exame está demorando mais que o esperado, mas continuará sendo processado em segundo plano. Você será notificado quando estiver pronto.';
      } else if (error instanceof Error) {
        errorDetails = error.message;
      }
      
      toast.error(errorMessage, {
        description: errorDetails,
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const pollExamStatus = async (
    userId: string,
    s3Key: string,
    examId: string,
    onStatusUpdate?: (message: string, progress: number, status?: FileQueueItem['status']) => void
  ) => {
    const startTime = Date.now();
    let attempts = 0;
    let currentIntervalId: NodeJS.Timeout | null = null;
    let realtimeChannel: any = null;
    let lastStatusMessage = ''; // ✅ Controle de estado anterior

    return new Promise<void>((resolve, reject) => {
      // 🔄 Função para limpar recursos
      const cleanup = () => {
        if (currentIntervalId) {
          clearTimeout(currentIntervalId);
          currentIntervalId = null;
        }
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
        }
      };

      // 📊 Função para atualizar progresso baseado no tempo
      const updateProgress = (elapsedSeconds: number) => {
        let currentProgress = 50;
        let statusMsg = '';

        if (elapsedSeconds < 10) {
          currentProgress = 50 + (elapsedSeconds / 10) * 10; // 50% -> 60%
          statusMsg = `Extraindo texto do documento... (${elapsedSeconds}s)`;
        } else if (elapsedSeconds < 30) {
          currentProgress = 60 + ((elapsedSeconds - 10) / 20) * 20; // 60% -> 80%
          statusMsg = `Analisando com IA... (${elapsedSeconds}s)`;
        } else if (elapsedSeconds < 90) {
          currentProgress = 80 + ((elapsedSeconds - 30) / 60) * 12; // 80% -> 92%
          const mins = Math.floor(elapsedSeconds / 60);
          const secs = elapsedSeconds % 60;
          statusMsg = mins > 0
            ? `Organizando biomarcadores... (${mins}min ${secs}s)`
            : `Organizando biomarcadores... (${elapsedSeconds}s)`;
        } else {
          currentProgress = 92 + ((elapsedSeconds - 90) / 210) * 6; // 92% -> 98%
          const mins = Math.floor(elapsedSeconds / 60);
          const secs = elapsedSeconds % 60;
          statusMsg = `Finalizando processamento... (${mins}min ${secs}s)`;
        }

        // ✅ Só atualizar se a FASE mudou (ignora tempo entre parênteses)
        const statusMsgBase = statusMsg.split('(')[0].trim();
        const lastMsgBase = lastStatusMessage.split('(')[0].trim();
        
        if (statusMsgBase !== lastMsgBase) {
          setStatus(statusMsg);
          onStatusUpdate?.(statusMsg, Math.min(currentProgress, 98), 'processing');
          lastStatusMessage = statusMsg;
        }
        
        // Sempre atualizar o progresso numérico
        setProgress(Math.min(currentProgress, 98));
      };

      // 🚀 OTIMIZAÇÃO: Usar Supabase Realtime em vez de polling constante
      console.log('[Realtime] 📡 Conectando ao Supabase Realtime...');

      realtimeChannel = supabase
        .channel(`exam-${examId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'exams',
            filter: `id=eq.${examId}`
          },
          (payload) => {
            const newRecord = payload.new as any;
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

            console.log(`[Realtime] 🔔 Atualização recebida: status=${newRecord.processing_status} (${elapsedSeconds}s)`);

            if (newRecord.processing_status === 'completed') {
              const successMsg = newRecord.total_biomarkers
                ? `✅ Concluído! ${newRecord.total_biomarkers} biomarcadores extraídos`
                : '✅ Concluído!';

              onStatusUpdate?.(successMsg, 100, 'completed');
              setProgress(100);
              setStatus(successMsg);

              console.log(`[Realtime] ✅ Processamento concluído via Realtime (${elapsedSeconds}s)`);
              cleanup();
              resolve();
            } else if (newRecord.processing_status === 'error') {
              console.error(`[Realtime] ❌ Erro detectado via Realtime`);
              cleanup();
              reject(new Error('Erro no processamento do exame'));
            }
          }
        )
        .subscribe((status) => {
          console.log(`[Realtime] Status da subscrição: ${status}`);
        });

      // ⏱️ Timer para atualização visual de progresso
      const progressInterval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

        // Timeout de 5 minutos
        if (elapsedSeconds >= 300) {
          console.log(`[Realtime] ⏱️ Timeout de 5 minutos atingido`);
          clearInterval(progressInterval);
          cleanup();
          onStatusUpdate?.("Processamento em background...", 95);
          resolve();
          return;
        }

        updateProgress(elapsedSeconds);
      }, 1000); // Atualiza progresso a cada 1 segundo

      // 🔍 FALLBACK: Polling AWS apenas nos primeiros 20 segundos (caso webhook demore)
      const checkAWS = async () => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

        // Só verifica AWS nos primeiros 20 segundos
        if (elapsedSeconds >= 20) {
          console.log('[Realtime] ⏭️ Polling AWS encerrado, confiando apenas no Realtime');
          if (currentIntervalId) clearTimeout(currentIntervalId);
          return;
        }

        attempts++;
        console.log(`[Realtime] 🔍 Polling AWS (tentativa ${attempts}, ${elapsedSeconds}s)`);

        try {
          const response = await fetch(`${EDGE_FUNCTION_URL}?userId=${userId}&s3Key=${encodeURIComponent(s3Key)}`, {
            headers: {
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            }
          });

          if (response.ok) {
            const data = await response.json();

            if (data.status === 'completed' && data.data) {
              console.log(`[Realtime] ✅ Concluído via AWS antes do webhook (${elapsedSeconds}s)`);

              const totalBiomarkers = data.data.metadata?.total_exames || data.data.total_exames || 0;
              const successMsg = totalBiomarkers
                ? `✅ Concluído! ${totalBiomarkers} biomarcadores extraídos`
                : '✅ Concluído!';

              onStatusUpdate?.(successMsg, 100, 'completed');
              setProgress(100);
              setStatus(successMsg);

              clearInterval(progressInterval);
              cleanup();
              await syncExamToSupabase(examId, data);
              resolve();
              return;
            } else if (data.status === 'failed') {
              console.error(`[Realtime] ❌ AWS retornou 'failed'`);
              clearInterval(progressInterval);
              cleanup();
              reject(new Error('Erro no processamento AWS'));
              return;
            }
          }
        } catch (error) {
          console.warn(`[Realtime] ⚠️ Erro ao verificar AWS:`, error);
        }

        // Agendar próxima verificação (apenas se ainda estiver dentro dos 20s)
        if (elapsedSeconds < 20) {
          currentIntervalId = setTimeout(checkAWS, 5000); // Verifica AWS a cada 5s
        }
      };

      // Iniciar verificação AWS (fallback para primeiros 20s)
      checkAWS();
    });
  };

  const syncExamToSupabase = async (examId: string, awsResponse: AWSExamData) => {
    const syncKey = `sync_${examId}`;
    if (sessionStorage.getItem(syncKey)) return;
    sessionStorage.setItem(syncKey, 'true');
    
    try {
      const awsData = awsResponse.data;
      if (!awsData) {
        sessionStorage.removeItem(syncKey);
        throw new Error('awsResponse.data está undefined');
      }
      
      const dadosBasicos = awsData.dados_basicos || {
        laboratorio: awsData.laboratorio || '',
        paciente: awsData.paciente || '',
        data_exame: awsData.data_exame || '',
        medico_solicitante: awsData.medico_solicitante || null,
      };
      
      // Deletar resultados antigos
      await supabase.from('exam_results').delete().eq('exam_id', examId);
      
      // Update exam
      const { error: updateError } = await supabase
        .from("exams")
        .update({
          processing_status: "completed",
          processed_at: awsResponse.processedAt || new Date().toISOString(),
          laboratory: dadosBasicos.laboratorio,
          patient_name_extracted: dadosBasicos.paciente,
          total_biomarkers: awsData.metadata?.total_exames || awsData.total_exames || 0,
          raw_aws_response: awsData as any,
        })
        .eq("id", examId);

      if (updateError) {
        sessionStorage.removeItem(syncKey);
        throw updateError;
      }

      // Inserir biomarcadores DIRETO (sem processamento)
      if (awsData.exames?.length > 0) {
        const biomarkers = awsData.exames.map((exam) => {
          const valueNumeric = typeof exam.resultado === 'string'
            ? parseFloat(exam.resultado.replace(',', '.'))
            : exam.resultado;

          return {
            exam_id: examId,
            biomarker_name: exam.nome,
            category: exam.categoria,
            value: String(exam.resultado),
            value_numeric: isNaN(valueNumeric) ? null : valueNumeric,
            unit: exam.unidade,
            reference_min: exam.referencia_min,
            reference_max: exam.referencia_max,
            status: exam.status as "normal" | "alto" | "baixo" | "alterado",
            observation: exam.observacao || null,
            deviation_percentage: exam.desvio_percentual,
            layman_explanation: exam.explicacao_leiga,
            possible_causes: exam.possiveis_causas_alteracao,
            original_name: exam.nome_original || exam.nome,
            normalization_confidence: exam.confianca_normalizacao || null,
            normalization_type: exam.tipo_normalizacao || null,
          };
        });

        const { error: biomarkersError } = await supabase
          .from("exam_results")
          .insert(biomarkers);

        if (biomarkersError) {
          sessionStorage.removeItem(syncKey);
          throw biomarkersError;
        }
      }

      // Biomarcadores rejeitados
      if (awsData.biomarcadores_rejeitados?.length > 0) {
        const rejectedRecords = awsData.biomarcadores_rejeitados.map(rejected => ({
          exam_id: examId,
          original_name: rejected.nome_original,
          original_value: rejected.valor_original || null,
          rejection_reason: rejected.motivo_rejeicao || rejected.motivo,
          suggestions: rejected.sugestoes || [],
          similarity_score: rejected.similaridade || null,
        }));

        await supabase.from('rejected_biomarkers').insert(rejectedRecords);
      }
      
      sessionStorage.removeItem(syncKey);
      
    } catch (error) {
      sessionStorage.removeItem(syncKey);
      throw error;
    }
  };

  // Método com auto-matching
  const uploadExamWithAutoMatching = async ({ 
    file, 
    examDate, 
    onComplete,
    onMatchRequired,
    onStatusUpdate,
  }: {
    file: File;
    examDate?: Date;
    onComplete?: () => void;
    onMatchRequired?: (extractedName: string, candidates: any[], examId: string) => void;
    onStatusUpdate?: (message: string, progress: number, status?: FileQueueItem['status']) => void;
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

      // 2. Sanitizar nome do arquivo (AWS Lambda adiciona o timestamp)
      const sanitizedFileName = sanitizeFileName(file.name);

      console.log(`[AutoMatch] Arquivo original: ${file.name}`);
      console.log(`[AutoMatch] Arquivo sanitizado: ${sanitizedFileName}`);
      console.log(`[AutoMatch] Content-Type: ${contentType}`);

      // 3. Get upload URL
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          action: "getUploadUrl",
          userId: "temp", // Temporário
          fileName: sanitizedFileName,
          contentType: contentType,
        }),
      });

      if (!response.ok) throw new Error("Erro ao gerar URL de upload");
      const { uploadUrl, s3Key, contentType: awsContentType } = await response.json();
      setProgress(20);

      // 4. Create exam without patient_id (será preenchido depois)
      // A AWS Lambda retorna o s3Key com timestamp, extrair o filename
      const s3FileName = s3Key.split('/').pop() || sanitizedFileName;
      
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .insert({
          patient_id: null, // NULL temporariamente
          uploaded_by: user.id,
          aws_file_key: s3Key,
          aws_file_name: s3FileName, // ✅ Usar o nome do S3 com timestamp da Lambda
          exam_date: examDate?.toISOString().split("T")[0],
          processing_status: "uploading",
        })
        .select()
        .single();

      if (examError) throw examError;
      setProgress(30);

      // 4. Upload para S3 com Content-Type retornado pela AWS
      setStatus("Enviando arquivo...");
      onStatusUpdate?.("Enviando arquivo...", 30);
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
      onStatusUpdate?.("Processando com IA...", 50, 'processing');
      await pollExamStatus("temp", s3Key, exam.id, onStatusUpdate);

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

  // Upload múltiplo com processamento sequencial
  const uploadMultipleExams = async ({
    files,
    patientId,
    examDate,
    onComplete,
    onMatchRequired,
    onProgressUpdate,
  }: {
    files: File[];
    patientId?: string;
    examDate?: Date;
    onComplete?: () => void;
    onMatchRequired?: (extractedName: string, candidates: any[], examId: string, fileId: string) => void;
    onProgressUpdate?: (queue: FileQueueItem[]) => void;
  }) => {
    // Criar fila inicial
    const queue: FileQueueItem[] = files.map(file => ({
      file,
      id: crypto.randomUUID(),
      status: 'pending' as const,
      progress: 0,
      statusMessage: 'Aguardando...',
    }));

    // Notificar UI da fila inicial
    onProgressUpdate?.(queue);

    // Processar sequencialmente
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      
      try {
        // Atualizar status para "uploading"
        item.status = 'uploading';
        item.statusMessage = 'Enviando arquivo...';
        onProgressUpdate?.([...queue]);

        if (patientId) {
          // Upload manual com paciente conhecido
          await uploadExam({
            patientId,
            file: item.file,
            examDate,
            onStatusUpdate: (message, progress, status) => {
              item.statusMessage = message;
              item.progress = progress;
              if (status) item.status = status;
              onProgressUpdate?.([...queue]);
            },
            onComplete: () => {
              item.status = 'completed';
              item.progress = 100;
              onProgressUpdate?.([...queue]);
            },
          });
        } else {
          // Upload com auto-matching
          await uploadExamWithAutoMatching({
            file: item.file,
            examDate,
            onStatusUpdate: (message, progress, status) => {
              item.statusMessage = message;
              item.progress = progress;
              if (status) item.status = status;
              onProgressUpdate?.([...queue]);
            },
            onComplete: () => {
              item.status = 'completed';
              item.progress = 100;
              item.statusMessage = 'Processado!';
              onProgressUpdate?.([...queue]);
            },
            onMatchRequired: (name, candidates, examId) => {
              item.statusMessage = 'Aguardando seleção...';
              onProgressUpdate?.([...queue]);
              onMatchRequired?.(name, candidates, examId, item.id);
            },
          });
        }

      } catch (error) {
        item.status = 'error';
        item.error = error instanceof Error ? error.message : 'Erro desconhecido';
        item.statusMessage = 'Erro no processamento';
        onProgressUpdate?.([...queue]);
        console.error(`Erro no arquivo ${item.file.name}:`, error);
        // Continuar para próximo arquivo mesmo com erro
      }
    }

    // Todos processados
    onComplete?.();
  };

  return {
    uploadExam,
    uploadExamWithAutoMatching,
    uploadMultipleExams,
    uploading,
    progress,
    status,
  };
}
