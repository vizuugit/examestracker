import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CorrectionData {
  examId: string;
  fieldName: 'paciente' | 'laboratorio' | 'data_exame' | 'data_nascimento';
  aiValue: string;
  userValue: string;
  textSample?: string;
}

interface CorrectionStats {
  total_exams_processed: number;
  total_corrections: number;
  accuracy_percentage: number;
  error_types: Record<string, number>;
  ready_for_training: boolean;
}

export function useExamCorrection() {
  const [submitting, setSubmitting] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  const submitCorrection = async (data: CorrectionData) => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Detectar tipo de correção
      let correctionType = 'outro';
      if (data.fieldName === 'paciente' && isValidPatientName(data.aiValue)) {
        correctionType = 'nome_virou_lab';
      } else if (data.fieldName === 'laboratorio' && isValidPatientName(data.aiValue)) {
        correctionType = 'lab_virou_nome';
      } else if (data.fieldName === 'data_exame') {
        correctionType = 'data_exame_errada';
      } else if (data.fieldName === 'data_nascimento') {
        correctionType = 'data_nascimento_errada';
      }

      const { error } = await supabase.from('corrections').insert({
        user_id: user.id,
        exam_id: data.examId,
        field_name: data.fieldName,
        ai_value: data.aiValue,
        user_value: data.userValue,
        correction_type: correctionType,
        text_sample: data.textSample?.substring(0, 5000),
      });

      if (error) throw error;

      // Atualizar o exame com os dados corretos
      const updateData: any = {};
      if (data.fieldName === 'paciente') {
        updateData.patient_name_extracted = data.userValue;
      } else if (data.fieldName === 'laboratorio') {
        updateData.laboratory = data.userValue;
      } else if (data.fieldName === 'data_exame') {
        updateData.exam_date = data.userValue;
      }

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('exams')
          .update(updateData)
          .eq('id', data.examId);
      }

      toast.success("Obrigado! Sua correção vai ajudar a IA a melhorar 🚀");
      return true;
    } catch (error) {
      console.error("Erro ao enviar correção:", error);
      toast.error("Erro ao enviar correção");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const getCorrectionStats = async (): Promise<CorrectionStats | null> => {
    setLoadingStats(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Buscar correções do usuário
      const { data: corrections, error: corrError } = await supabase
        .from('corrections')
        .select('*')
        .eq('user_id', user.id);

      if (corrError) throw corrError;

      // Buscar total de exames processados
      const { count: totalExams } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .eq('uploaded_by', user.id)
        .eq('processing_status', 'completed');

      const total_corrections = corrections?.length || 0;
      const total_exams_processed = totalExams || 0;

      // Calcular accuracy
      const accuracy_percentage = total_exams_processed > 0
        ? ((total_exams_processed - total_corrections) / total_exams_processed) * 100
        : 100;

      // Agrupar por tipo de erro
      const error_types: Record<string, number> = {};
      corrections?.forEach(corr => {
        const type = corr.correction_type || 'outro';
        error_types[type] = (error_types[type] || 0) + 1;
      });

      return {
        total_exams_processed,
        total_corrections,
        accuracy_percentage: Math.round(accuracy_percentage * 100) / 100,
        error_types,
        ready_for_training: total_corrections >= 50,
      };
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      return null;
    } finally {
      setLoadingStats(false);
    }
  };

  return {
    submitCorrection,
    getCorrectionStats,
    submitting,
    loadingStats,
  };
}

// Helper: Validar se parece nome de pessoa
function isValidPatientName(name: string): boolean {
  if (!name || name.length < 8 || name.length > 80) return false;
  
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return false;
  
  const blacklist = [
    'laboratorio', 'laboratório', 'data', 'valores', 'referencia',
    'resultado', 'exame', 'laudo', 'entrada', 'pedido'
  ];
  
  const nameLower = name.toLowerCase();
  return !blacklist.some(word => nameLower.includes(word));
}
