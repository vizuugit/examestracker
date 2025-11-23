import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useArchivePatient = () => {
  const queryClient = useQueryClient();

  const archivePatient = useMutation({
    mutationFn: async (patientId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('patients')
        .update({
          archived: true,
          archived_at: new Date().toISOString(),
          archived_by: user?.id
        })
        .eq('id', patientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast.success("Paciente arquivado com sucesso", {
        description: "O paciente pode ser restaurado a qualquer momento."
      });
    },
    onError: (error) => {
      console.error('Error archiving patient:', error);
      toast.error("Erro ao arquivar paciente", {
        description: "Não foi possível arquivar o paciente. Tente novamente."
      });
    },
  });

  const unarchivePatient = useMutation({
    mutationFn: async (patientId: string) => {
      const { error } = await supabase
        .from('patients')
        .update({
          archived: false,
          archived_at: null,
          archived_by: null
        })
        .eq('id', patientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['archived-patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast.success("Paciente restaurado com sucesso");
    },
    onError: (error) => {
      console.error('Error unarchiving patient:', error);
      toast.error("Erro ao restaurar paciente", {
        description: "Não foi possível restaurar o paciente. Tente novamente."
      });
    },
  });

  return {
    archivePatient: archivePatient.mutate,
    isArchiving: archivePatient.isPending,
    unarchivePatient: unarchivePatient.mutate,
    isUnarchiving: unarchivePatient.isPending,
  };
};
