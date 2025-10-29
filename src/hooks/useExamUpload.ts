import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { deduplicateExams } from "@/utils/examDeduplication";
import { normalizeBiomarkerWithTable } from "@/utils/biomarkerNormalization";
import { normalizeHematologicalValue, calculateAbsoluteReference } from "@/utils/valueNormalizer";
import { getBiomarkerNormalizationService } from "@/services/BiomarkerNormalizationService";

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
  status: 'pending' | 'uploading' | 'completed' | 'error';
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
    }>;
    
    metadata?: {
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
    onStatusUpdate?: (message: string, progress: number) => void;
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
      onStatusUpdate?.("Processando com IA...", 50);
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
    onStatusUpdate?: (message: string, progress: number) => void
  ) => {
    const maxAttempts = 60; // 60 tentativas x 3 segundos = 180 segundos (3 minutos)
    let attempts = 0;
    const startTime = Date.now();
    let lastProgressToast = 0;

    return new Promise<void>((resolve, reject) => {
      const interval = setInterval(async () => {
        attempts++;
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const currentProgress = 50 + (attempts / maxAttempts) * 40; // 50% -> 90%
        setProgress(currentProgress);

        // Mensagens progressivas com tempo
        let statusMsg = '';
        if (elapsedSeconds < 30) {
          statusMsg = `Processando com IA... (${elapsedSeconds}s)`;
        } else if (elapsedSeconds < 60) {
          statusMsg = `Processando com IA... (${Math.floor(elapsedSeconds / 60)}min ${elapsedSeconds % 60}s)`;
        } else if (elapsedSeconds < 120) {
          statusMsg = `Processando com IA... (${Math.floor(elapsedSeconds / 60)}min - quase lá)`;
        } else {
          statusMsg = `Processando com IA... (${Math.floor(elapsedSeconds / 60)}min - aguarde mais um pouco)`;
        }
        
        setStatus(statusMsg);
        onStatusUpdate?.(statusMsg, currentProgress);

        // 🔔 Toast de progresso a cada 30 segundos
        if (elapsedSeconds > 0 && elapsedSeconds % 30 === 0 && elapsedSeconds !== lastProgressToast) {
          lastProgressToast = elapsedSeconds;
          toast.info("Processamento em andamento", {
            description: `Já se passaram ${elapsedSeconds}s. Estamos analisando seu exame com IA...`,
            duration: 3000,
          });
        }

        try {
          // ========================================
          // 🆕 POLLING HÍBRIDO: Verificar 2 fontes
          // ========================================
          
          // 1️⃣ Verificar Supabase PRIMEIRO (mais confiável após webhook)
          console.log(`[Polling Híbrido] Tentativa ${attempts}/${maxAttempts} (${elapsedSeconds}s)`);
          
          const { data: examData, error: examError } = await supabase
            .from('exams')
            .select('processing_status, total_biomarkers, patient_name_extracted')
            .eq('id', examId)
            .single();
          
          if (!examError && examData) {
            console.log(`[Polling Híbrido] Status no Supabase:`, examData.processing_status);
            
            // ✅ Se o webhook já atualizou o Supabase, parar imediatamente
            if (examData.processing_status === 'completed') {
              console.log(`[Polling Híbrido] ✅ Exame concluído (detectado via Supabase após ${elapsedSeconds}s)!`);
              console.log(`[Polling Híbrido] Total de biomarcadores: ${examData.total_biomarkers}`);
              
              const successMsg = examData.total_biomarkers 
                ? `Processado! ${examData.total_biomarkers} biomarcadores extraídos`
                : 'Processado com sucesso!';
              
              onStatusUpdate?.(successMsg, 100);
              
              // 🔔 Toast de sucesso via Supabase
              toast.success("Exame processado via Supabase!", {
                description: `${examData.total_biomarkers} biomarcadores extraídos em ${elapsedSeconds}s`,
                duration: 4000,
              });
              
              clearInterval(interval);
              resolve();
              return;
            }
            
            // ❌ Se falhou no Supabase, parar com erro
            if (examData.processing_status === 'error') {
              console.error(`[Polling Híbrido] ❌ Erro detectado no Supabase`);
              
              // 🔔 Toast de erro
              toast.error("Erro no processamento", {
                description: "O exame falhou ao ser processado. Tente novamente.",
                duration: 5000,
              });
              
              clearInterval(interval);
              reject(new Error('Erro no processamento do exame'));
              return;
            }
          }
          
          // 2️⃣ Se Supabase ainda está 'processing', verificar AWS também
          console.log(`[Polling Híbrido] Verificando AWS...`);
          
          const response = await fetch(`${EDGE_FUNCTION_URL}?userId=${userId}&s3Key=${encodeURIComponent(s3Key)}`, {
            headers: {
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            }
          });
          
          if (!response.ok) {
            console.warn('[Polling Híbrido] Erro na AWS, mas Supabase será checado novamente');
            // Não rejeitar - continuar tentando via Supabase
          } else {
            const data = await response.json();
            console.log(`[Polling Híbrido] Resposta AWS:`, data);

            // Se AWS retornou status 'completed'
            if (data.status === 'completed' && data.data) {
              console.log(`[Polling Híbrido] ✅ Processamento concluído (detectado via AWS após ${elapsedSeconds}s)!`);
              
              const totalBiomarkers = data.data.metadata?.total_exames || data.data.total_exames || 0;
              const successMsg = totalBiomarkers 
                ? `Processado! ${totalBiomarkers} biomarcadores extraídos`
                : 'Processado com sucesso!';
              
              onStatusUpdate?.(successMsg, 100);
              
              // 🔔 Toast de sucesso via AWS
              toast.success("Exame processado via AWS!", {
                description: `${totalBiomarkers} biomarcadores extraídos em ${elapsedSeconds}s`,
                duration: 4000,
              });
              
              clearInterval(interval);
              await syncExamToSupabase(examId, data);
              resolve();
              return;
            } else if (data.status === 'processing') {
              console.log(`[Polling Híbrido] ⏳ AWS ainda processando...`);
            } else if (data.status === 'failed') {
              console.error(`[Polling Híbrido] ❌ AWS retornou status 'failed'`);
              
              // 🔔 Toast de erro AWS
              toast.error("Erro no processamento AWS", {
                description: "O exame falhou ao ser processado pela AWS. Tente novamente.",
                duration: 5000,
              });
              
              clearInterval(interval);
              reject(new Error('Erro no processamento AWS'));
              return;
            }
          }

          // 3️⃣ Timeout check
          if (attempts >= maxAttempts) {
            console.log(`[Polling Híbrido] ⏱️ Timeout após ${elapsedSeconds}s - processamento continuará em background via webhook`);
            clearInterval(interval);
            
            toast.info("Processamento em andamento", {
              description: "Seu exame está sendo processado em background. Recarregue a página em alguns minutos para ver o resultado.",
              duration: 6000,
            });
            
            resolve();
          }
        } catch (error) {
          console.error(`[Polling Híbrido] Erro na tentativa ${attempts}:`, error);
          
          // Não rejeitar imediatamente - continuar tentando
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            reject(error);
          }
        }
      }, 3000); // Poll every 3 seconds
    });
  };

  const syncExamToSupabase = async (examId: string, awsResponse: AWSExamData) => {
    // 🔒 Proteção contra múltiplas sincronizações simultâneas
    const syncKey = `sync_${examId}`;
    if (sessionStorage.getItem(syncKey)) {
      console.log('[syncExamToSupabase] ⚠️ Sincronização já em andamento, ignorando...');
      return;
    }
    sessionStorage.setItem(syncKey, 'true');
    
    try {
      console.log('[Sync] 1. Estrutura completa:', JSON.stringify(awsResponse, null, 2).substring(0, 500));
      
      const awsData = awsResponse.data;
      console.log('[Sync] 2. awsData existe?', !!awsData);
      
      // VALIDAÇÃO CRÍTICA
      if (!awsData) {
        sessionStorage.removeItem(syncKey);
        throw new Error('❌ awsResponse.data está undefined');
      }
      
      // ✅ ADAPTAR PARA FORMATO ANTIGO E NOVO
      const dadosBasicos = awsData.dados_basicos || {
        laboratorio: awsData.laboratorio || '',
        paciente: awsData.paciente || '',
        data_exame: awsData.data_exame || '',
        medico_solicitante: awsData.medico_solicitante || null,
      };
      
      console.log('[Sync] 3. Formato detectado:', awsData.dados_basicos ? 'NOVO' : 'ANTIGO');
      console.log('[Sync] 4. laboratorio:', dadosBasicos.laboratorio);
      console.log('[Sync] 5. paciente:', dadosBasicos.paciente);
      
      // 🗑️ PASSO 1: Deletar resultados antigos para evitar duplicação
      console.log('[syncExamToSupabase] 🗑️ Deletando resultados antigos...');
      const { error: deleteError } = await supabase
        .from('exam_results')
        .delete()
        .eq('exam_id', examId);
      
      if (deleteError) {
        console.error('[syncExamToSupabase] ❌ Erro ao deletar resultados antigos:', deleteError);
      }
      
      // Update exam with AWS data (only basic extraction data, no insights)
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

      // 🔍 PASSO 2: Normalizar e inserir biomarcadores
      if (awsData.exames && awsData.exames.length > 0) {
        const originalCount = awsData.exames.length;
        
        // ✅ USAR DEDUPLICAÇÃO AVANÇADA
        const dedupedExams = deduplicateExams(awsData.exames);
        const removedCount = originalCount - dedupedExams.length;
        
        console.log(`[syncExamToSupabase] 📊 Biomarcadores: ${originalCount} → ${dedupedExams.length} (${removedCount} duplicata${removedCount !== 1 ? 's' : ''} removida${removedCount !== 1 ? 's' : ''})`);
        
        // 🆕 NORMALIZAR BIOMARCADORES COM O NOVO SERVIÇO
        console.log('[syncExamToSupabase] 🔄 Normalizando biomarcadores...');
        const normalizationService = await getBiomarkerNormalizationService();
        const validationResult = normalizationService.validatePayload({
          biomarcadores: dedupedExams.map(b => ({
            nome: b.nome,
            valor: b.resultado,
            unidade: b.unidade,
            referencia: `${b.referencia_min || ''}-${b.referencia_max || ''}`,
          })),
          data_exame: dadosBasicos.data_exame,
        });

        console.log(`[syncExamToSupabase] ✅ Normalização concluída:`);
        console.log(`  - Processados: ${validationResult.stats.processed}`);
        console.log(`  - Rejeitados: ${validationResult.stats.rejected}`);
        console.log(`  - Exact: ${validationResult.stats.exactMatches}`);
        console.log(`  - Synonym: ${validationResult.stats.synonymMatches}`);
        console.log(`  - Fuzzy: ${validationResult.stats.fuzzyMatches}`);

        // Find total leukocytes for absolute value calculations
        const leucocitosData = validationResult.processedBiomarkers.find((b) => 
          b.normalizedName && (
            b.normalizedName.toLowerCase().includes('leucócito') ||
            b.normalizedName.toLowerCase().includes('leucocito') ||
            b.normalizedName.toLowerCase() === 'wbc'
          ) && b.unit !== '%'
        );
        
        // Get original exam data for leukocyte value
        const leucocitosOriginal = dedupedExams.find((b) => 
          b.nome && (
            b.nome.toLowerCase().includes('leucócito') ||
            b.nome.toLowerCase().includes('leucocito') ||
            b.nome.toLowerCase() === 'wbc'
          ) && b.unidade !== '%'
        );
        const leucocitosTotal = leucocitosOriginal ? parseFloat(leucocitosOriginal.resultado) : null;
        console.log('[syncExamToSupabase] Total leukocytes found:', leucocitosTotal);
        
        const biomarkers = validationResult.processedBiomarkers.map((match) => {
          // Find original exam data
          const originalExam = dedupedExams.find(e => e.nome === match.originalName);
          if (!originalExam) {
            console.warn(`[syncExamToSupabase] Original exam not found for: ${match.originalName}`);
            return null;
          }
          
          // Parse original value once
          const originalValue = typeof originalExam.resultado === 'string' 
            ? parseFloat(originalExam.resultado.replace(',', '.'))
            : originalExam.resultado;
          
          // Normalize large values (like hemácias)
          const { normalizedValue, normalizedUnit } = normalizeHematologicalValue(
            originalExam.resultado,
            match.normalizedName,
            match.unit
          );
          
          let valueNumeric: number | null = normalizedValue;
          let finalUnit = normalizedUnit || match.unit;
          
          // If normalization didn't work, use the parsed original
          if (valueNumeric === originalValue || (typeof valueNumeric === 'number' && isNaN(valueNumeric))) {
            valueNumeric = isNaN(originalValue) ? null : originalValue;
          }

          // Normalize reference values if the main value was normalized
          let normalizedRefMin = originalExam.referencia_min;
          let normalizedRefMax = originalExam.referencia_max;
          
          // If the value was normalized (changed), normalize references too
          if (valueNumeric !== null && !isNaN(originalValue) && valueNumeric !== originalValue && originalValue > 0) {
            const normalizationFactor = valueNumeric / originalValue;
            normalizedRefMin = originalExam.referencia_min ? originalExam.referencia_min * normalizationFactor : null;
            normalizedRefMax = originalExam.referencia_max ? originalExam.referencia_max * normalizationFactor : null;
          }

          return {
            exam_id: examId,
            biomarker_name: match.normalizedName,
            category: match.category,
            value: String(originalExam.resultado),
            value_numeric: valueNumeric,
            unit: finalUnit,
            reference_min: normalizedRefMin,
            reference_max: normalizedRefMax,
            status: originalExam.status as "normal" | "alto" | "baixo" | "alterado",
            observation: originalExam.observacao || null,
            deviation_percentage: originalExam.desvio_percentual,
            layman_explanation: originalExam.explicacao_leiga,
            possible_causes: originalExam.possiveis_causas_alteracao,
            // 🆕 Campos de auditoria
            original_name: match.originalName,
            normalization_confidence: match.confidence,
            normalization_type: match.matchType,
          };
        }).filter(Boolean);
        
        // Calculate absolute values for leukogram cells (neutrophils, lymphocytes, etc.)
        if (leucocitosTotal) {
          const cellTypes = ['segmentado', 'bastonete', 'linfócito', 'linfocito', 'monócito', 'monocito', 'eosinófilo', 'eosinofilo', 'basófilo', 'basofilo'];
          
          for (const biomarker of dedupedExams) {
            const isLeukogramCell = cellTypes.some(type => 
              biomarker.nome && biomarker.nome.toLowerCase().includes(type)
            );
            
            if (isLeukogramCell && biomarker.unidade === '%' && biomarker.resultado) {
              const percentValue = parseFloat(biomarker.resultado);
              if (!isNaN(percentValue)) {
                const absoluteValue = (percentValue / 100) * leucocitosTotal;
                
                // Normalize the absolute biomarker name
                const normalizationService = await getBiomarkerNormalizationService();
                const absoluteNameResult = normalizationService.validatePayload({
                  biomarcadores: [{ nome: `${biomarker.nome} (Absoluto)`, valor: absoluteValue, unidade: '/mm³' }],
                });
                
                const absoluteMatch = absoluteNameResult.processedBiomarkers[0];
                
                biomarkers.push({
                  exam_id: examId,
                  biomarker_name: absoluteMatch?.normalizedName || `${biomarker.nome} (Absoluto)`,
                  category: absoluteMatch?.category || 'hematologico',
                  value: Math.round(absoluteValue).toString(),
                  value_numeric: Math.round(absoluteValue),
                  unit: '/mm³',
                  reference_min: calculateAbsoluteReference(biomarker.referencia_min, leucocitosTotal),
                  reference_max: calculateAbsoluteReference(biomarker.referencia_max, leucocitosTotal),
                  status: biomarker.status as "normal" | "alto" | "baixo" | "alterado",
                  observation: biomarker.observacao || null,
                  deviation_percentage: biomarker.desvio_percentual,
                  layman_explanation: biomarker.explicacao_leiga,
                  possible_causes: biomarker.possiveis_causas_alteracao,
                  // 🆕 Campos de auditoria
                  original_name: `${biomarker.nome} (Absoluto)`,
                  normalization_confidence: absoluteMatch?.confidence || null,
                  normalization_type: absoluteMatch?.matchType || 'manual',
                });
              }
            }
          }
        }
        
        console.log(`[syncExamToSupabase] 📊 Total biomarkers to insert (including calculated absolutes): ${biomarkers.length}`);

        const { error: biomarkersError } = await supabase
          .from("exam_results")
          .insert(biomarkers);

        if (biomarkersError) {
          sessionStorage.removeItem(syncKey);
          throw biomarkersError;
        }
        
        console.log(`[syncExamToSupabase] ✅ ${biomarkers.length} biomarcadores salvos com sucesso`);
        
        // 🆕 SALVAR BIOMARCADORES REJEITADOS
        if (validationResult.rejectedBiomarkers.length > 0) {
          console.log(`[syncExamToSupabase] ⚠️ Salvando ${validationResult.rejectedBiomarkers.length} biomarcadores rejeitados...`);
          
          const rejectedRecords = validationResult.rejectedBiomarkers.map(rejected => ({
            exam_id: examId,
            original_name: rejected.originalName,
            original_value: dedupedExams.find(e => e.nome === rejected.originalName)?.resultado || null,
            rejection_reason: rejected.reason,
            suggestions: rejected.suggestions,
            similarity_score: rejected.similarity || null,
          }));
          
          const { error: rejectedError } = await supabase
            .from('rejected_biomarkers')
            .insert(rejectedRecords);
          
          if (rejectedError) {
            console.error('[syncExamToSupabase] ❌ Erro ao salvar biomarcadores rejeitados:', rejectedError);
          } else {
            console.log(`[syncExamToSupabase] ✅ ${rejectedRecords.length} biomarcadores rejeitados registrados`);
          }
        }
        
        // 🆕 REGISTRAR DUPLICATAS DETECTADAS
        if (validationResult.duplicates.length > 0) {
          console.log(`[syncExamToSupabase] ⚠️ Salvando ${validationResult.duplicates.length} duplicatas detectadas...`);
          
          const duplicateRecords = validationResult.duplicates.map(dup => ({
            exam_id: examId,
            biomarker_name: dup.biomarkerName,
            conflict_type: dup.conflictType,
            conflicting_values: dup.values,
            resolved: !dup.requiresManualReview,
          }));
          
          const { error: duplicateError } = await supabase
            .from('biomarker_duplicates')
            .insert(duplicateRecords);
          
          if (duplicateError) {
            console.error('[syncExamToSupabase] ❌ Erro ao salvar duplicatas:', duplicateError);
          } else {
            console.log(`[syncExamToSupabase] ✅ ${duplicateRecords.length} duplicatas registradas`);
          }
        }
      }
      
      // ✅ Liberar flag de sincronização
      sessionStorage.removeItem(syncKey);
      
    } catch (error) {
      // 🚨 Liberar flag em caso de erro
      sessionStorage.removeItem(syncKey);
      console.error('[syncExamToSupabase] ❌ Erro geral:', error);
      throw error;
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

      // 2. Sanitizar nome do arquivo
      const sanitizedFileName = sanitizeFileName(file.name);
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '-');
      const finalFileName = `${timestamp}-${sanitizedFileName}`;

      console.log(`[AutoMatch] Arquivo original: ${file.name}`);
      console.log(`[AutoMatch] Arquivo sanitizado: ${finalFileName}`);
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
          fileName: finalFileName,
          contentType: contentType,
        }),
      });

      if (!response.ok) throw new Error("Erro ao gerar URL de upload");
      const { uploadUrl, s3Key, contentType: awsContentType } = await response.json();
      setProgress(20);

      // 4. Create exam without patient_id (será preenchido depois)
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .insert({
          patient_id: null, // NULL temporariamente
          uploaded_by: user.id,
          aws_file_key: s3Key,
          aws_file_name: finalFileName,
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
      await pollExamStatus("temp", s3Key, exam.id, undefined);

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
            onStatusUpdate: (message, progress) => {
              item.statusMessage = message;
              item.progress = progress;
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
