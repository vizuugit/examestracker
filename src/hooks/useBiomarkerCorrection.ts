import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface BiomarkerCorrection {
  biomarkerId: string;
  fieldName: string;
  aiValue: string | number | null;
  userValue: string | number | null;
  textSample?: string;
}

interface SaveBiomarkerCorrectionsParams {
  patientId: string;
  examId: string;
  corrections: BiomarkerCorrection[];
}

export const useBiomarkerCorrection = () => {
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const submitBiomarkerCorrections = async ({
    patientId,
    examId,
    corrections,
  }: SaveBiomarkerCorrectionsParams) => {
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('📤 Enviando correções de biomarcadores:', {
        examId,
        corrections: corrections.length,
      });

      const { data, error } = await supabase.functions.invoke('aws-proxy', {
        body: {
          action: 'saveBiomarkerCorrections',
          userId: user.id,
          examId: examId,
          corrections: corrections.map(c => ({
            biomarkerId: c.biomarkerId,
            fieldName: c.fieldName,
            aiValue: c.aiValue,
            userValue: c.userValue,
            textSample: c.textSample,
          })),
        },
      });

      if (error) {
        console.error('❌ Erro ao salvar correções:', error);
        throw error;
      }

      console.log('✅ Correções salvas:', data);

      // Notificar admin sobre as correções
      for (const correction of corrections) {
        const { error: notifyError } = await supabase.functions.invoke('notify-admin-correction', {
          body: {
            type: 'user_correction',
            userId: user.id,
            examId: examId,
            relatedId: correction.biomarkerId,
            biomarkerName: correction.biomarkerId,
            fieldChanged: correction.fieldName,
            oldValue: correction.aiValue,
            newValue: correction.userValue,
          },
        });

        if (notifyError) {
          console.warn('⚠️ Erro ao notificar admin:', notifyError);
        }
      }

      // Invalidar cache para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['patient-tracking-table', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient-biomarkers', patientId] });

      toast({
        title: '✓ Correções salvas!',
        description: `${corrections.length} campo(s) corrigido(s). O administrador foi notificado.`,
      });

      return data;
    } catch (error) {
      console.error('❌ Erro:', error);
      toast({
        title: 'Erro ao salvar correções',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitBiomarkerCorrections,
    submitting,
  };
};
