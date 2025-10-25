import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BiomarkerTrackingTable } from '@/components/BiomarkerTrackingTable';
import { Skeleton } from '@/components/ui/skeleton';
import { categorizeBiomarker } from '@/utils/biomarkerCategories';

/**
 * Normaliza nome do biomarcador para deduplicação
 */
function normalizeBiomarkerName(name: string): string {
  if (!name) return "";
  
  let normalized = name.toLowerCase();
  normalized = normalized.replace(/\([^)]*\)/g, '');
  
  const noiseWords = ['de', 'da', 'do', 'jejum', 'soro', 'sangue', 'total', '-'];
  const words = normalized.split(/\s+/);
  const filtered = words.filter(w => w.trim() && !noiseWords.includes(w.trim()));
  
  return filtered.join(' ').trim();
}

/**
 * Calcula score de completude do biomarcador
 */
function calculateCompletenessScore(data: any): number {
  let score = 0;
  if (data.value) score += 10;
  if (data.unit) score += 5;
  if (data.reference_min !== null) score += 3;
  if (data.reference_max !== null) score += 3;
  if (data.status) score += 2;
  return score;
}

/**
 * Normaliza nome da categoria para unificar variações
 */
function normalizeCategoryName(category: string | null): string {
  if (!category) return 'minerais';
  
  const normalized = category.toLowerCase().trim();
  
  const categoryMap: Record<string, string> = {
    'hematologia': 'hematologico',
    'eritrograma': 'hematologico',
    'hematológico': 'hematologico',
    'hematologico': 'hematologico',
    'hemograma': 'hematologico',
    'cardiovascular': 'cardiovascular',
    'metabólico': 'metabolico',
    'metabolico': 'metabolico',
    'hormonal': 'hormonal',
    'renal': 'renal',
    'hepático': 'hepatico',
    'hepatico': 'hepatico',
    'minerais': 'minerais',
    'vitaminas': 'minerais',
    'minerais e vitaminas': 'minerais'
  };
  
  return categoryMap[normalized] || 'minerais';
}

export default function PatientDashboard() {
  const { id } = useParams();

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: trackingTableData, isLoading: trackingLoading } = useQuery({
    queryKey: ['patient-tracking-table', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          id,
          biomarker_name,
          value,
          value_numeric,
          unit,
          reference_min,
          reference_max,
          status,
          category,
          manually_corrected,
          exams!inner (
            id,
            exam_date,
            laboratory,
            patient_id,
            created_at
          )
        `)
        .eq('exams.patient_id', id)
        .order('exam_date', { ascending: true, foreignTable: 'exams' })
        .order('created_at', { ascending: false, foreignTable: 'exams' });
      
      if (error) throw error;

      // Estruturar dados por biomarcador com deduplicação
      const biomarkerMap = new Map<string, any>();
      const examDatesSet = new Set<string>();

      data?.forEach((result: any) => {
        const originalName = result.biomarker_name;
        const normalizedKey = normalizeBiomarkerName(originalName);
        
        const examId = result.exams.id;
        const examDate = result.exams.exam_date || result.exams.created_at;
        const isEstimatedDate = !result.exams.exam_date;
        
        examDatesSet.add(`${examId}|${examDate}|${isEstimatedDate ? 'estimated' : 'manual'}`);

        // Se biomarcador não existe, criar entrada
        if (!biomarkerMap.has(normalizedKey)) {
          const rawCategory = result.category || categorizeBiomarker(originalName);
          const category = normalizeCategoryName(rawCategory);
          
          biomarkerMap.set(normalizedKey, {
            biomarker_name: originalName,
            unit: result.unit,
            reference_min: result.reference_min,
            reference_max: result.reference_max,
            category,
            values: new Map(),
            completeness_score: calculateCompletenessScore(result)
          });
        } else {
          // Biomarcador já existe, verificar se devemos atualizar metadados
          const existing = biomarkerMap.get(normalizedKey)!;
          const newScore = calculateCompletenessScore(result);
          
          // Atualizar metadados se este registro for mais completo
          if (newScore > existing.completeness_score) {
            existing.biomarker_name = originalName;
            existing.unit = result.unit || existing.unit;
            existing.reference_min = result.reference_min ?? existing.reference_min;
            existing.reference_max = result.reference_max ?? existing.reference_max;
            existing.completeness_score = newScore;
          }
        }

        const biomarkerData = biomarkerMap.get(normalizedKey)!;
        
        // Adicionar valor do exame
        if (!biomarkerData.values.has(examId)) {
          biomarkerData.values.set(examId, {
            result_id: result.id,
            exam_id: examId,
            exam_date: examDate,
            value: result.value,
            value_numeric: result.value_numeric,
            status: result.status,
            manually_corrected: result.manually_corrected || false,
          });
        }
      });

      // Converter Map para array e agrupar por categoria
      const biomarkers = Array.from(biomarkerMap.values()).map(b => ({
        ...b,
        values: Array.from(b.values.values())
      }));

      // Ordenar por categoria e depois por nome
      biomarkers.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.biomarker_name.localeCompare(b.biomarker_name);
      });

      return {
        biomarkers,
        examDates: Array.from(examDatesSet).sort()
      };
    }
  });

  const isLoading = patientLoading || trackingLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-zinc-900 to-black">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-zinc-900 to-black">
      <Navbar showBackButton={true} backButtonPath="/patients" />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Tabela de Acompanhamento */}
        {trackingTableData && trackingTableData.biomarkers.length > 0 && (
          <BiomarkerTrackingTable
            patientId={id!}
            data={trackingTableData.biomarkers}
            examDates={trackingTableData.examDates}
            patientName={patient?.full_name || ''}
          />
        )}

        {/* Estado Vazio */}
        {trackingTableData && trackingTableData.biomarkers.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="p-6 rounded-2xl bg-gray-50 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Activity className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Nenhum exame encontrado
            </h3>
            <p className="text-gray-600 text-base mb-6 max-w-md mx-auto">
              Adicione exames ao paciente para visualizar o histórico de biomarcadores
            </p>
            <Button
              onClick={() => window.location.href = `/patients/${id}`}
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-lg"
            >
              Adicionar Primeiro Exame
            </Button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
