import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Activity, Calendar } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BiomarkerChart } from '@/components/BiomarkerChart';
import { BiomarkerCategoryCard } from '@/components/BiomarkerCategoryCard';
import { ExamComparisonTable } from '@/components/ExamComparisonTable';
import { BiomarkerTrackingTable } from '@/components/BiomarkerTrackingTable';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { BIOMARKER_CATEGORIES, categorizeBiomarker, CategoryKey } from '@/utils/biomarkerCategories';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { subDays } from 'date-fns';

type PeriodFilter = 'all' | '30' | '90' | '180' | '365';

interface BiomarkerData {
  biomarker_name: string;
  unit: string | null;
  reference_min: number | null;
  reference_max: number | null;
  history: Array<{
    exam_date: string;
    value_numeric: number;
    status: string;
    laboratory: string | null;
  }>;
}

export default function PatientDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [viewMode, setViewMode] = useState<'categories' | 'table'>('categories');

  // Buscar informações do paciente
  const { data: patient } = useQuery({
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

  // Buscar todos os resultados de exames do paciente
  const { data: biomarkersData, isLoading } = useQuery({
    queryKey: ['patient-biomarkers-history', id, periodFilter],
    queryFn: async () => {
      let query = supabase
        .from('exam_results')
        .select(`
          *,
          exams!inner (
            exam_date,
            laboratory,
            patient_id
          )
        `)
        .eq('exams.patient_id', id)
        .order('exam_date', { ascending: true, foreignTable: 'exams' });

      // Aplicar filtro de período
      if (periodFilter !== 'all') {
        const daysAgo = subDays(new Date(), parseInt(periodFilter));
        query = query.gte('exams.exam_date', daysAgo.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Agrupar por biomarcador
      const grouped = new Map<string, BiomarkerData>();
      
      data?.forEach((result: any) => {
        const key = result.biomarker_name;
        if (!grouped.has(key)) {
          grouped.set(key, {
            biomarker_name: result.biomarker_name,
            unit: result.unit,
            reference_min: result.reference_min,
            reference_max: result.reference_max,
            history: []
          });
        }
        
        grouped.get(key)!.history.push({
          exam_date: result.exams.exam_date,
          value_numeric: result.value_numeric,
          status: result.status,
          laboratory: result.exams.laboratory
        });
      });

      return Array.from(grouped.values());
    }
  });

  // Buscar todos os exames para tabela de acompanhamento longitudinal
  const { data: trackingTableData } = useQuery({
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

      // Estruturar dados por biomarcador
      const biomarkerMap = new Map<string, any>();
      const examDatesSet = new Set<string>();

      data?.forEach((result: any) => {
        const key = result.biomarker_name;
        const examId = result.exams.id;
        const examDate = result.exams.exam_date || result.exams.created_at;
        const isEstimatedDate = !result.exams.exam_date;
        
        // Cada exam_id gera uma coluna única
        examDatesSet.add(`${examId}|${examDate}|${isEstimatedDate ? 'estimated' : 'manual'}`);

        if (!biomarkerMap.has(key)) {
          biomarkerMap.set(key, {
            biomarker_name: result.biomarker_name,
            unit: result.unit,
            reference_min: result.reference_min,
            reference_max: result.reference_max,
            category: result.category || 'Outros',
            values: new Map()
          });
        }

        const biomarkerData = biomarkerMap.get(key)!;
        
        // Cada exam_id gera um valor único (mesmo que a data seja igual)
        if (!biomarkerData.values.has(examId)) {
          biomarkerData.values.set(examId, {
            result_id: result.id, // ✅ ID único do exam_result
            exam_id: examId,
            exam_date: examDate,
            value: result.value,
            value_numeric: result.value_numeric,
            status: result.status,
            manually_corrected: result.manually_corrected || false,
          });
        }
      });

      return {
        biomarkers: Array.from(biomarkerMap.values()).map(b => ({
          ...b,
          values: Array.from(b.values.values())
        })),
        examDates: Array.from(examDatesSet).sort()
      };
    }
  });

  // Agrupar biomarcadores por categoria
  const categorizedBiomarkers = biomarkersData?.reduce((acc, biomarker) => {
    const category = categorizeBiomarker(biomarker.biomarker_name);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(biomarker);
    return acc;
  }, {} as Record<CategoryKey, BiomarkerData[]>);

  // Calcular estatísticas por categoria
  const categoryStats = Object.entries(BIOMARKER_CATEGORIES).map(([key, category]) => {
    const biomarkers = categorizedBiomarkers?.[key as CategoryKey] || [];
    const normalCount = biomarkers.filter(b => {
      const lastResult = b.history[b.history.length - 1];
      return lastResult?.status === 'normal';
    }).length;
    const alteredCount = biomarkers.length - normalCount;

    return {
      key: key as CategoryKey,
      name: category.name,
      total: biomarkers.length,
      normal: normalCount,
      altered: alteredCount
    };
  }).filter(stat => stat.total > 0);

  const filteredBiomarkers = selectedCategory 
    ? categorizedBiomarkers?.[selectedCategory] || []
    : biomarkersData || [];

  const filteredData = selectedCategory 
    ? trackingTableData?.biomarkers.filter(b => categorizeBiomarker(b.biomarker_name) === selectedCategory) || []
    : trackingTableData?.biomarkers || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar showBackButton={true} backButtonPath={`/patients/${id}`} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar showBackButton={true} backButtonPath={`/patients/${id}`} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 mb-8 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-medical-purple/10">
                <Activity className="w-8 h-8 text-medical-purple" />
              </div>
              Dashboard de Acompanhamento
            </h1>
            <p className="text-gray-600 mt-2 text-lg font-medium">
              {patient?.full_name}
            </p>
          </div>

        {/* View: Categorias */}
        {viewMode === 'categories' && categoryStats.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1 w-12 bg-gradient-to-r from-medical-purple to-medical-purple/50 rounded-full" />
              <h2 className="text-2xl font-bold text-gray-900">
                Categorias de Biomarcadores
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card "Todos os Exames" */}
              <BiomarkerCategoryCard
                category={'cardiovascular' as CategoryKey}
                categoryName="Todos os Exames"
                totalBiomarkers={biomarkersData?.length || 0}
                normalCount={biomarkersData?.filter(b => b.history[b.history.length - 1]?.status === 'normal').length || 0}
                alteredCount={biomarkersData?.filter(b => b.history[b.history.length - 1]?.status !== 'normal').length || 0}
                onClick={() => {
                  setSelectedCategory(null);
                  setViewMode('table');
                }}
              />
              
              {/* Cards de Categorias */}
              {categoryStats.map(stat => (
                <BiomarkerCategoryCard
                  key={stat.key}
                  category={stat.key}
                  categoryName={stat.name}
                  totalBiomarkers={stat.total}
                  normalCount={stat.normal}
                  alteredCount={stat.altered}
                  onClick={() => {
                    setSelectedCategory(stat.key);
                    setViewMode('table');
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* View: Tabela Filtrada */}
        {viewMode === 'table' && trackingTableData && trackingTableData.biomarkers.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  setSelectedCategory(null);
                  setViewMode('categories');
                }}
                className="bg-white border-2 border-medical-purple text-medical-purple hover:bg-medical-purple/5 font-semibold rounded-full"
              >
                ← Voltar às categorias
              </Button>
              {selectedCategory && (
                <h2 className="text-2xl font-bold text-gray-900">
                  {BIOMARKER_CATEGORIES[selectedCategory].name}
                </h2>
              )}
            </div>
            
            <BiomarkerTrackingTable 
              patientId={id!}
              data={selectedCategory ? filteredData : trackingTableData.biomarkers}
              examDates={trackingTableData.examDates}
              patientName={patient?.full_name}
              initialCategory={selectedCategory || undefined}
            />
          </div>
        )}


        {/* Empty State */}
        {biomarkersData?.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="p-4 rounded-full bg-gray-100 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Activity className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Nenhum biomarcador encontrado
            </h3>
            <p className="text-gray-600 text-lg">
              Adicione exames ao paciente para visualizar o dashboard de evolução
            </p>
          </div>
        )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
