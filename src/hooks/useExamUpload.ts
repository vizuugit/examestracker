import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aws-proxy`;

interface UploadOptions {
  patientId: string;
  file: File;
  examDate?: Date;
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

  const uploadExam = async ({ patientId, file, examDate }: UploadOptions) => {
    try {
      setUploading(true);
      setProgress(10);
      setStatus("Preparando upload...");

      // 1. Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 2. Get upload URL from Edge Function (proxy to AWS)
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          userId: patientId,
          fileName: file.name,
        }),
      });

      if (!response.ok) throw new Error("Erro ao gerar URL de upload");

      const { uploadUrl, fileName, fileKey } = await response.json();
      setProgress(20);

      // 3. Create exam record in Supabase (status: uploading)
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

      // 4. Upload PDF to S3
      setStatus("Enviando arquivo...");
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "application/pdf" },
      });

      if (!uploadResponse.ok) throw new Error("Erro no upload do arquivo");
      setProgress(50);

      // 5. Update status to 'processing'
      await supabase
        .from("exams")
        .update({ processing_status: "processing" })
        .eq("id", exam.id);

      // 6. Start polling
      setStatus("Processando com IA...");
      await pollExamStatus(patientId, fileName, exam.id);

      setProgress(100);
      setStatus("Concluído!");
      toast.success("Exame processado com sucesso!", {
        description: `${exam.total_biomarkers || 0} biomarcadores extraídos.`,
      });

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
    const maxAttempts = 30; // 30 tentativas x 3 segundos = 90 segundos max
    let attempts = 0;

    return new Promise<void>((resolve, reject) => {
      const interval = setInterval(async () => {
        attempts++;
        setProgress(50 + (attempts / maxAttempts) * 40); // 50% -> 90%

        try {
          // Fetch status from Edge Function (proxy to AWS)
          const response = await fetch(`${EDGE_FUNCTION_URL}?userId=${userId}`, {
            headers: {
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            }
          });
          if (!response.ok) throw new Error("Erro ao verificar status");

          const data = await response.json();
          const awsExam = data.exams.find(
            (e: AWSExamData) => e.file_name === fileName && e.status === "completed"
          );

          if (awsExam) {
            // Processing completed!
            clearInterval(interval);
            await syncExamToSupabase(examId, awsExam);
            resolve();
          } else if (attempts >= maxAttempts) {
            // Timeout
            clearInterval(interval);
            await supabase
              .from("exams")
              .update({ processing_status: "error" })
              .eq("id", examId);
            reject(new Error("Timeout no processamento"));
          }
        } catch (error) {
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

  return {
    uploadExam,
    uploading,
    progress,
    status,
  };
}
