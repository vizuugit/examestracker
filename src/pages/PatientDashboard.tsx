import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Activity, ArrowLeft, Heart, Droplet, Bone, Brain, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BiomarkerCategoryCard } from '@/components/BiomarkerCategoryCard';
import { BiomarkerTrackingTable } from '@/components/BiomarkerTrackingTable';
import { HeroStats } from '@/components/HeroStats';
import { CriticalAlertsCard } from '@/components/CriticalAlertsCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useMemo } from 'react';
import { BIOMARKER_CATEGORIES, categorizeBiomarker, CategoryKey } from '@/utils/biomarkerCategories';
import { subDays } from 'date-fns';

const getCategoryIcon = (category: CategoryKey) => {
  const icons: Record<CategoryKey, React.ReactNode> = {
    cardiovascular: <Heart className="w-7 h-7" />,
    metabolico: <Activity className="w-7 h-7" />,
    hematologico: <Droplet className="w-7 h-7" />,
    hormonal: <Brain className="w-7 h-7" />,
    hepatico: <Zap className="w-7 h-7" />,
    renal: <Droplet className="w-7 h-7" />,
    minerais: <Bone className="w-7 h-7" />,
  };
  return icons[category] || <Activity className="w-7 h-7" />;
};

type PeriodFilter = 'all' | '30' | '90' | '180' | '365';

interface BiomarkerData {
  biomarker_name: string;
  unit: string | null;
  reference_min: number | null;
  reference_max: number | null;
  status: 'normal' | 'alto' | 'baixo';
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
            status: result.status,
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
      icon: getCategoryIcon(key as CategoryKey),
      total: biomarkers.length,
      normal: normalCount,
      altered: alteredCount
    };
  }).filter(stat => stat.total > 0);

  // Calcular estatísticas para Hero
  const totalBiomarkers = biomarkersData?.length || 0;
  const totalNormal = biomarkersData?.filter(b => {
    const lastResult = b.history[b.history.length - 1];
    return lastResult?.status === 'normal';
  }).length || 0;
  const totalAltered = totalBiomarkers - totalNormal;
  const healthScore = totalBiomarkers > 0 ? Math.round((totalNormal / totalBiomarkers) * 100) : 100;

  // Identificar alertas críticos
  const criticalAlerts = useMemo(() => {
    if (!biomarkersData) return [];
    return biomarkersData
      .filter(b => {
        const lastResult = b.history[b.history.length - 1];
        return lastResult && (lastResult.status === 'alto' || lastResult.status === 'baixo');
      })
      .slice(0, 5)
      .map(b => ({
        biomarkerName: b.biomarker_name,
        value: `${b.history[b.history.length - 1].value_numeric} ${b.unit || ''}`,
        status: b.history[b.history.length - 1].status as 'alto' | 'baixo' | 'crítico',
        reference: b.reference_min && b.reference_max 
          ? `${b.reference_min} - ${b.reference_max} ${b.unit || ''}`
          : 'N/A'
      }));
  }, [biomarkersData]);

  const filteredBiomarkers = selectedCategory 
    ? categorizedBiomarkers?.[selectedCategory] || []
    : biomarkersData || [];

  const filteredData = selectedCategory 
    ? trackingTableData?.biomarkers.filter(b => categorizeBiomarker(b.biomarker_name) === selectedCategory) || []
    : trackingTableData?.biomarkers || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-48 w-full rounded-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-80 rounded-3xl" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Botão de voltar */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/patients')}
            className="hover:bg-gray-100 text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Pacientes
          </Button>
        </div>

        {/* Hero Stats */}
        {patient && (
          <HeroStats
            patientName={patient.full_name}
            totalExams={totalBiomarkers}
            normalCount={totalNormal}
            attentionCount={totalAltered}
            healthScore={healthScore}
            lastUpdate={new Date()}
          />
        )}

        {/* Critical Alerts */}
        <CriticalAlertsCard alerts={criticalAlerts} />

        {/* Categorias */}
        {biomarkersData && biomarkersData.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1 w-12 bg-gradient-to-r from-medical-purple-600 to-purple-600 rounded-full" />
              <h2 className="text-3xl font-bold text-gray-900">
                Visão por Categorias
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryStats.map((stat) => (
                <BiomarkerCategoryCard
                  key={stat.key}
                  category={stat.key}
                  categoryName={stat.name}
                  icon={stat.icon}
                  totalCount={stat.total}
                  normalCount={stat.normal}
                  alteredCount={stat.altered}
                  patientId={id!}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tabela Completa */}
        {trackingTableData && trackingTableData.biomarkers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1 w-12 bg-gradient-to-r from-medical-purple-600 to-purple-600 rounded-full" />
              <h2 className="text-3xl font-bold text-gray-900">
                Acompanhamento Longitudinal
              </h2>
            </div>
            <BiomarkerTrackingTable
              patientId={id!}
              data={filteredData.length > 0 ? filteredData : trackingTableData.biomarkers}
              examDates={trackingTableData.examDates}
              patientName={patient?.full_name || ''}
            />
          </div>
        )}

        {/* Estado vazio */}
        {(!biomarkersData || biomarkersData.length === 0) && !isLoading && (
          <div className="text-center py-20 bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-xl border-2 border-dashed border-gray-300">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Activity className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Nenhum biomarcador encontrado
            </h3>
            <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
              Adicione exames ao paciente para visualizar o dashboard de evolução
            </p>
            <Button
              onClick={() => navigate(`/patients/${id}`)}
              className="bg-gradient-to-r from-medical-purple-600 to-purple-600 hover:from-purple-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-full"
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
