import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useDeletePatient = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const deletePatient = useMutation({
    mutationFn: async (patientId: string) => {
      const { count } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId);

      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) throw error;
      
      return { examCount: count || 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      const examText = data.examCount === 1 ? '1 exame' : `${data.examCount} exames`;
      toast.success("Paciente excluído com sucesso", {
        description: data.examCount > 0 ? `${examText} também foram removidos.` : undefined
      });
      
      navigate('/patients');
    },
    onError: (error) => {
      console.error('Error deleting patient:', error);
      toast.error("Erro ao excluir paciente", {
        description: "Não foi possível excluir o paciente. Tente novamente."
      });
    },
  });

  return {
    deletePatient: deletePatient.mutate,
    isDeleting: deletePatient.isPending,
  };
};
