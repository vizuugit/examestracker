import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDeleteExam = () => {
  const queryClient = useQueryClient();

  const deleteExam = useMutation({
    mutationFn: async (examId: string) => {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-exams'] });
      queryClient.invalidateQueries({ queryKey: ['recent-exams'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['biomarker-history'] });
      queryClient.invalidateQueries({ queryKey: ['tracking-table-data'] });
      
      toast.success("Exame excluído com sucesso");
    },
    onError: (error) => {
      console.error('Error deleting exam:', error);
      toast.error("Erro ao excluir exame", {
        description: "Não foi possível excluir o exame. Tente novamente."
      });
    },
  });

  return {
    deleteExam: deleteExam.mutate,
    isDeleting: deleteExam.isPending,
  };
};
