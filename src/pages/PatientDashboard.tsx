import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, Calendar } from 'lucide-react';
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
        .not('value_numeric', 'is', null)
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
          *,
          exams!inner (
            id,
            exam_date,
            laboratory,
            patient_id
          )
        `)
        .eq('exams.patient_id', id)
        .order('exam_date', { ascending: true, foreignTable: 'exams' });
      
      if (error) throw error;

      // Estruturar dados por biomarcador
      const biomarkerMap = new Map<string, any>();
      const examDatesSet = new Set<string>();

      data?.forEach((result: any) => {
        const key = result.biomarker_name;
        examDatesSet.add(result.exams.exam_date);

        if (!biomarkerMap.has(key)) {
          biomarkerMap.set(key, {
            biomarker_name: result.biomarker_name,
            unit: result.unit,
            reference_min: result.reference_min,
            reference_max: result.reference_max,
            category: result.category || 'Outros',
            values: []
          });
        }

        biomarkerMap.get(key)!.values.push({
          exam_date: result.exams.exam_date,
          value: result.value,
          value_numeric: result.value_numeric,
          status: result.status
        });
      });

      return {
        biomarkers: Array.from(biomarkerMap.values()),
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
      <div className="min-h-screen bg-gradient-to-br from-rest-black via-rest-charcoal to-rest-black p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rest-black via-rest-charcoal to-rest-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/patients/${id}`)}
              className="border-rest-blue text-rest-blue hover:bg-rest-blue/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Activity className="w-8 h-8 text-rest-blue" />
                Dashboard de Acompanhamento
              </h1>
              <p className="text-rest-gray mt-1">
                {patient?.full_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rest-gray" />
            <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}>
              <SelectTrigger className="w-[180px] bg-card/50 border-border">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os exames</SelectItem>
                <SelectItem value="30">Último mês</SelectItem>
                <SelectItem value="90">Últimos 3 meses</SelectItem>
                <SelectItem value="180">Últimos 6 meses</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View: Categorias */}
        {viewMode === 'categories' && categoryStats.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Categorias de Biomarcadores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory(null);
                  setViewMode('categories');
                }}
                className="border-rest-blue text-rest-blue hover:bg-rest-blue/10"
              >
                ← Voltar às categorias
              </Button>
              {selectedCategory && (
                <h2 className="text-xl font-semibold text-white">
                  {BIOMARKER_CATEGORIES[selectedCategory].name}
                </h2>
              )}
              {!selectedCategory && (
              <span className="bg-rest-blue backdrop-blur-sm px-5 py-2 rounded-lg font-bold text-white border-2 border-white/30 shadow-lg">
                Todos os Exames
              </span>
              )}
            </div>
            
            <BiomarkerTrackingTable 
              data={selectedCategory ? filteredData : trackingTableData.biomarkers}
              examDates={trackingTableData.examDates}
              patientName={patient?.full_name}
              initialCategory={selectedCategory || undefined}
            />
          </div>
        )}


        {/* Empty State */}
        {biomarkersData?.length === 0 && (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-rest-gray mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Nenhum biomarcador encontrado
            </h3>
            <p className="text-rest-gray">
              Adicione exames ao paciente para visualizar o dashboard de evolução
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
