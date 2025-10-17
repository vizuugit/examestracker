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
  file_name: string;
  status: string;
  laboratorio: string;
  paciente: string;
  data_exame: string;
  total_exames: number;
  processed_at: string;
  exames: Array<{
    nome: string;
    categoria: string;
    resultado: string;
    unidade: string;
    referencia_min: number | null;
    referencia_max: number | null;
    status: string;
    observacao: string;
  }>;
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
          userId: patientId,
          fileName: file.name,
          contentType: contentType,
        }),
      });

      if (!response.ok) throw new Error("Erro ao gerar URL de upload");

      const { uploadUrl, fileName, fileKey, contentType: awsContentType } = await response.json();
      setProgress(20);

      // 4. Create exam record in Supabase (status: uploading)
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .insert({
          patient_id: patientId,
          uploaded_by: user.id,
          aws_file_key: fileKey,
          aws_file_name: fileName,
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
      await pollExamStatus(patientId, fileName, exam.id);

      setProgress(100);
      setStatus("Concluído!");
      toast.success("Exame processado com sucesso!", {
        description: `${exam.total_biomarkers || 0} biomarcadores extraídos.`,
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

  const pollExamStatus = async (userId: string, fileName: string, examId: string) => {
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
          console.log(`[Polling] Tentativa ${attempts}/${maxAttempts} (${elapsedSeconds}s) - Verificando status para ${fileName}`);
          
          const response = await fetch(`${EDGE_FUNCTION_URL}?userId=${userId}`, {
            headers: {
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            }
          });
          if (!response.ok) throw new Error("Erro ao verificar status");

          const data = await response.json();
          console.log(`[Polling] Resposta AWS:`, data);
          
          const awsExam = data.exams.find(
            (e: AWSExamData) => e.file_name === fileName
          );

          if (!awsExam) {
            console.warn(`[Polling] Exame não encontrado na resposta AWS`);
          } else {
            console.log(`[Polling] Status do exame: ${awsExam.status}, Total exames: ${awsExam.total_exames}`);
          }

          // Detectar exame travado: agora espera 3 minutos (60 tentativas x 3s) antes de considerar travado
          if (attempts > 60 && awsExam && awsExam.status === "processing" && awsExam.total_exames === 0) {
            console.error(`[Polling] Exame travado detectado após ${elapsedSeconds}s - campos vazios`);
            clearInterval(interval);
            await supabase
              .from("exams")
              .update({ processing_status: "error" })
              .eq("id", examId);
            reject(new Error("O processamento parece estar travado. Por favor, tente novamente."));
            return;
          }

          if (awsExam && awsExam.status === "completed") {
            // Processing completed!
            console.log(`[Polling] ✅ Processamento concluído após ${elapsedSeconds}s!`);
            clearInterval(interval);
            await syncExamToSupabase(examId, awsExam);
            resolve();
          } else if (attempts >= maxAttempts) {
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

  const syncExamToSupabase = async (examId: string, awsData: AWSExamData) => {
    // Update exam with AWS data
    const { error: updateError } = await supabase
      .from("exams")
      .update({
        processing_status: "completed",
        processed_at: awsData.processed_at,
        laboratory: awsData.laboratorio,
        patient_name_extracted: awsData.paciente,
        total_biomarkers: awsData.total_exames,
        raw_aws_response: awsData as any,
      })
      .eq("id", examId);

    if (updateError) throw updateError;

    // Insert biomarkers
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
      observation: b.observacao,
    }));

    const { error: biomarkersError } = await supabase
      .from("exam_results")
      .insert(biomarkers);

    if (biomarkersError) throw biomarkersError;
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
          userId: "temp", // Temporário
          fileName: file.name,
          contentType: contentType,
        }),
      });

      if (!response.ok) throw new Error("Erro ao gerar URL de upload");
      const { uploadUrl, fileName, fileKey, contentType: awsContentType } = await response.json();
      setProgress(20);

      // 3. Create exam without patient_id (será preenchido depois)
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .insert({
          patient_id: null, // NULL temporariamente
          uploaded_by: user.id,
          aws_file_key: fileKey,
          aws_file_name: fileName,
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
      await pollExamStatus("temp", fileName, exam.id);

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
