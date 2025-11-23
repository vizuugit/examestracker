import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface MissingBiomarkerData {
  examId: string;
  biomarkerName: string;
  value: string;
  valueNumeric?: number;
  unit?: string;
  referenceMin?: number;
  referenceMax?: number;
  suggestedCategory?: string;
  observation?: string;
}

export const useAddMissingBiomarker = () => {
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const addMissingBiomarker = async (data: MissingBiomarkerData) => {
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('📤 Adicionando biomarcador ausente:', data.biomarkerName);

      // Inserir biomarcador ausente
      const { data: insertedData, error: insertError } = await supabase
        .from('missing_biomarkers')
        .insert({
          user_id: user.id,
          exam_id: data.examId,
          biomarker_name: data.biomarkerName,
          value: data.value,
          value_numeric: data.valueNumeric,
          unit: data.unit,
          reference_min: data.referenceMin,
          reference_max: data.referenceMax,
          suggested_category: data.suggestedCategory,
          observation: data.observation,
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir biomarcador:', insertError);
        throw insertError;
      }

      console.log('✅ Biomarcador inserido:', insertedData);

      // Notificar admin
      const { error: notifyError } = await supabase.functions.invoke('notify-admin-correction', {
        body: {
          type: 'missing_biomarker',
          userId: user.id,
          examId: data.examId,
          relatedId: insertedData.id,
          biomarkerName: data.biomarkerName,
          metadata: {
            value: data.value,
            unit: data.unit,
            category: data.suggestedCategory,
          },
        },
      });

      if (notifyError) {
        console.warn('⚠️ Erro ao notificar admin:', notifyError);
        // Não falha a operação se notificação falhar
      }

      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['missing-biomarkers'] });

      toast({
        title: '✓ Biomarcador adicionado!',
        description: 'Obrigado pelo feedback. O administrador foi notificado.',
      });

      return insertedData;
    } catch (error) {
      console.error('❌ Erro:', error);
      toast({
        title: 'Erro ao adicionar biomarcador',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    addMissingBiomarker,
    submitting,
  };
};