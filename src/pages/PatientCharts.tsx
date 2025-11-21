import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BiomarkerChart } from "@/components/BiomarkerChart";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getBiomarkerCategory } from "@/services/biomarkerCategoryService";

interface BiomarkerOption {
  biomarker_name: string;
  unit: string | null;
  reference_min: number | null;
  reference_max: number | null;
  category: string;
  total_measurements: number;
  last_value: number | null;
  last_date: string;
}

interface BiomarkerDataPoint {
  exam_date: string;
  value_numeric: number;
  status: string;
  laboratory: string | null;
}

const PatientCharts = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedBiomarker, setSelectedBiomarker] = useState<string | null>(null);

  // Buscar dados do paciente
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .eq("professional_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  // Buscar lista de biomarcadores disponíveis
  const { data: biomarkers, isLoading: biomarkersLoading } = useQuery({
    queryKey: ["patient-biomarkers-list", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_results")
        .select(`
          biomarker_name,
          unit,
          reference_min,
          reference_max,
          category,
          value_numeric,
          exams!inner(patient_id, exam_date)
        `)
        .eq("exams.patient_id", id)
        .order("biomarker_name", { ascending: true });

      if (error) throw error;

      // Agrupar por biomarcador e calcular estatísticas
      const biomarkerMap = new Map<string, BiomarkerOption>();

      data?.forEach((item: any) => {
        const key = item.biomarker_name;
        if (!biomarkerMap.has(key)) {
          biomarkerMap.set(key, {
            biomarker_name: item.biomarker_name,
            unit: item.unit,
            reference_min: item.reference_min,
            reference_max: item.reference_max,
            category: getBiomarkerCategory(item.biomarker_name, item.category),
            total_measurements: 0,
            last_value: null,
            last_date: "",
          });
        }

        const biomarker = biomarkerMap.get(key)!;
        biomarker.total_measurements += 1;
        
        // Atualizar último valor se for mais recente
        if (!biomarker.last_date || item.exams.exam_date > biomarker.last_date) {
          biomarker.last_date = item.exams.exam_date;
          biomarker.last_value = item.value_numeric;
        }
      });

      return Array.from(biomarkerMap.values());
    },
    enabled: !!id,
  });

  // Buscar histórico do biomarcador selecionado
  const { data: biomarkerHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["biomarker-history", id, selectedBiomarker],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_results")
        .select(`
          value_numeric,
          status,
          exams!inner(exam_date, laboratory, patient_id)
        `)
        .eq("exams.patient_id", id)
        .eq("biomarker_name", selectedBiomarker)
        .order("exam_date", { ascending: true, foreignTable: "exams" });

      if (error) throw error;

      // Agrupar por data e pegar apenas o mais recente de cada dia
      const grouped = data?.reduce((acc, item: any) => {
        const date = item.exams.exam_date;
        if (!acc[date] || new Date(item.exams.exam_date) > new Date(acc[date].exam_date)) {
          acc[date] = {
            exam_date: item.exams.exam_date,
            value_numeric: item.value_numeric,
            status: item.status,
            laboratory: item.exams.laboratory,
          };
        }
        return acc;
      }, {} as Record<string, any>);

      return grouped ? Object.values(grouped).sort((a: any, b: any) => 
        new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
      ) : [];
    },
    enabled: !!selectedBiomarker && !!id,
  });

  // Calcular estatísticas do biomarcador selecionado
  const selectedBiomarkerData = biomarkers?.find(b => b.biomarker_name === selectedBiomarker);
  
  const stats = biomarkerHistory && selectedBiomarkerData ? {
    total: biomarkerHistory.length,
    average: biomarkerHistory.reduce((acc, curr) => acc + curr.value_numeric, 0) / biomarkerHistory.length,
    trend: calculateTrend(biomarkerHistory.map(h => h.value_numeric)),
    inRange: biomarkerHistory.filter(h => {
      const { reference_min, reference_max } = selectedBiomarkerData;
      if (!reference_min || !reference_max) return true;
      return h.value_numeric >= reference_min && h.value_numeric <= reference_max;
    }).length,
  } : null;

  // Agrupar biomarcadores por categoria
  const biomarkersByCategory = biomarkers
    ?.filter(biomarker => biomarker.biomarker_name && biomarker.biomarker_name.trim() !== "")
    .reduce((acc, biomarker) => {
      const category = biomarker.category || "Outros";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(biomarker);
      return acc;
    }, {} as Record<string, BiomarkerOption[]>);

  if (patientLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-rest-black via-rest-charcoal to-rest-black">
        <Navbar showBackButton={true} backButtonPath={`/patients/${id}`} />
        <main className="flex-1 p-6">
          <Skeleton className="h-96 bg-white/10" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-rest-black via-rest-charcoal to-rest-black">
        <Navbar showBackButton={true} backButtonPath="/patients" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Paciente não encontrado</h2>
            <Button onClick={() => navigate("/patients")} className="mt-4">
              Voltar para pacientes
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-rest-black via-rest-charcoal to-rest-black">
      <Navbar showBackButton={true} backButtonPath={`/patients/${id}`} />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Activity className="w-8 h-8 text-rest-green" />
              Gráficos Personalizados
            </h1>
            <p className="text-rest-gray mt-1">
              {patient.full_name}
            </p>
          </div>

        {/* Seleção de Biomarcador */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Selecione um Biomarcador</CardTitle>
            <CardDescription className="text-white/70">
              Escolha qual variável deseja acompanhar ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {biomarkersLoading ? (
              <Skeleton className="h-10 w-full bg-white/10" />
            ) : (
              <Select value={selectedBiomarker || ""} onValueChange={setSelectedBiomarker}>
                <SelectTrigger className="w-full bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Selecione um biomarcador..." />
                </SelectTrigger>
                <SelectContent className="bg-rest-charcoal border-white/20 max-h-[400px]">
                  {biomarkersByCategory && Object.entries(biomarkersByCategory).map(([category, items]) => (
                    <SelectGroup key={category}>
                      <SelectLabel className="text-rest-lightblue font-semibold">{category}</SelectLabel>
                      {items.map((biomarker) => (
                        <SelectItem key={biomarker.biomarker_name} value={biomarker.biomarker_name} className="text-white">
                          {biomarker.biomarker_name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Visualização do Gráfico */}
        {selectedBiomarker && selectedBiomarkerData && (
          <>
            {historyLoading ? (
              <Skeleton className="h-[500px] bg-white/10" />
            ) : biomarkerHistory && biomarkerHistory.length > 0 ? (
              <>
                {/* Card de Contexto Visual */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-sm text-white/70 mb-2">Valor Atual</p>
                        <p className="text-3xl font-bold text-white">
                          {biomarkerHistory[biomarkerHistory.length - 1].value_numeric} {selectedBiomarkerData.unit}
                        </p>
                        <p className="text-xs text-white/70 mt-1">
                          {format(new Date(biomarkerHistory[biomarkerHistory.length - 1].exam_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-white/70 mb-2">Faixa de Referência</p>
                        {selectedBiomarkerData.reference_min !== null && selectedBiomarkerData.reference_max !== null ? (
                          <p className="text-xl font-semibold text-white">
                            {selectedBiomarkerData.reference_min} - {selectedBiomarkerData.reference_max} {selectedBiomarkerData.unit}
                          </p>
                        ) : (
                          <p className="text-lg font-medium text-white/40 italic">
                            Ref. não disponível
                          </p>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-white/70 mb-2">Status</p>
                        <Badge 
                          className={`text-lg px-4 py-2 ${
                            biomarkerHistory[biomarkerHistory.length - 1].status === 'alto' || 
                            biomarkerHistory[biomarkerHistory.length - 1].status === 'crítico'
                              ? 'bg-destructive text-destructive-foreground'
                              : biomarkerHistory[biomarkerHistory.length - 1].status === 'baixo'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-green-500 text-white'
                          }`}
                        >
                          {biomarkerHistory[biomarkerHistory.length - 1].status === 'alto' && '🔴 ALTO'}
                          {biomarkerHistory[biomarkerHistory.length - 1].status === 'crítico' && '🔴 CRÍTICO'}
                          {biomarkerHistory[biomarkerHistory.length - 1].status === 'baixo' && '🟡 BAIXO'}
                          {biomarkerHistory[biomarkerHistory.length - 1].status === 'normal' && '🟢 NORMAL'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gráfico */}
                <BiomarkerChart
                  biomarkerName={selectedBiomarkerData.biomarker_name}
                  data={biomarkerHistory}
                  unit={selectedBiomarkerData.unit}
                  referenceMin={selectedBiomarkerData.reference_min}
                  referenceMax={selectedBiomarkerData.reference_max}
                />

                {/* Estatísticas */}
                {stats && (
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Activity className="w-5 h-5" />
                        Estatísticas do Biomarcador
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center p-4 rounded-lg bg-white/5 border border-white/20">
                          <p className="text-sm text-white/70 mb-2">📈 Total de Medições</p>
                          <p className="text-3xl font-bold text-white">{stats.total}</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-white/5 border border-white/20">
                          <p className="text-sm text-white/70 mb-2">📏 Valor Médio</p>
                          <p className="text-3xl font-bold text-white">
                            {stats.average.toFixed(1)}
                          </p>
                          <p className="text-xs text-white/70">{selectedBiomarkerData.unit}</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-white/5 border border-white/20">
                          <p className="text-sm text-white/70 mb-2">🎯 Tendência</p>
                          <p className={`text-4xl font-bold ${
                            stats.trend === 'up' ? 'text-destructive' : 
                            stats.trend === 'down' ? 'text-green-500' : 
                            'text-yellow-500'
                          }`}>
                            {stats.trend === 'up' ? '↑' : stats.trend === 'down' ? '↓' : '→'}
                          </p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-white/5 border border-white/20">
                          <p className="text-sm text-white/70 mb-2">✅ Dentro da Faixa</p>
                          <p className="text-3xl font-bold text-green-500">
                            {((stats.inRange / stats.total) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="bg-gradient-to-br from-background/95 to-muted/50 backdrop-blur-md border-primary/20">
                <CardContent className="text-center py-12">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum dado disponível para este biomarcador
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Estado vazio */}
        {!selectedBiomarker && !biomarkersLoading && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="text-center py-16">
              <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Selecione um biomarcador para começar
              </h3>
              <p className="text-muted-foreground">
                Escolha uma variável acima para visualizar seu histórico ao longo do tempo
              </p>
            </CardContent>
          </Card>
        )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

// Helper function para calcular tendência
function calculateTrend(data: number[]): 'up' | 'down' | 'stable' {
  if (data.length < 2) return 'stable';
  
  const recent = data.slice(-3);
  const avg = recent.reduce((a, b) => a + b) / recent.length;
  const lastValue = recent[recent.length - 1];
  
  const diff = ((lastValue - avg) / avg) * 100;
  
  if (diff > 5) return 'up';
  if (diff < -5) return 'down';
  return 'stable';
}

export default PatientCharts;
