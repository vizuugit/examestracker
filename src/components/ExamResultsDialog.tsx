import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExamInsightsPanel } from "@/components/ExamInsightsPanel";
import type { ExamWithInsights } from "@/types/exam-insights";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, TrendingUp, TrendingDown, CheckCircle, Brain, Loader2 } from "lucide-react";
import { categorizeBiomarker, getCategoryColor } from "@/utils/biomarkerCategories";
import { getCategoryOrder, getBiomarkerOrder } from "@/utils/biomarkerDisplayOrder";
import { useExamAnalysis } from "@/hooks/useExamAnalysis";

interface ExamResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string | null;
}

export function ExamResultsDialog({ open, onOpenChange, examId }: ExamResultsDialogProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { analyzeExam, analyzing } = useExamAnalysis();

  const { data: examData, isLoading } = useQuery({
    queryKey: ["exam-results", examId],
    queryFn: async () => {
      if (!examId) return null;

      const { data: exam, error: examError } = await supabase
        .from("exams")
        .select("*, exam_date, laboratory, health_score, risk_category, clinical_analysis, alerts, trends, recommendations")
        .eq("id", examId)
        .single();

      if (examError) throw examError;

      const { data: results, error: resultsError } = await supabase
        .from("exam_results")
        .select("*")
        .eq("exam_id", examId)
        .order("biomarker_name");

      if (resultsError) throw resultsError;

      return { exam, results };
    },
    enabled: !!examId && open,
  });

  const filteredResults = useMemo(() => {
    if (!examData?.results) return [];

    return examData.results.filter((result) => {
      // Filtro de categoria
      if (categoryFilter !== "all") {
        const resultCategory = categorizeBiomarker(result.biomarker_name);
        if (resultCategory !== categoryFilter) return false;
      }

      // Filtro de status
      if (statusFilter === "normal" && result.status !== "normal") return false;
      if (statusFilter === "altered" && result.status === "normal") return false;

      // Busca por nome
      if (
        searchQuery &&
        !result.biomarker_name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [examData, categoryFilter, statusFilter, searchQuery]);

  // Agrupar resultados por categoria
  const groupedResults = useMemo(() => {
    const grouped = filteredResults.reduce((acc, result) => {
      const category = categorizeBiomarker(result.biomarker_name);
      if (!acc[category]) acc[category] = [];
      acc[category].push(result);
      return acc;
    }, {} as Record<string, typeof filteredResults>);
    
    // Ordenar categorias
    return Object.entries(grouped).sort((a, b) => {
      const orderA = getCategoryOrder(a[0]);
      const orderB = getCategoryOrder(b[0]);
      return orderA - orderB;
    });
  }, [filteredResults]);

  const stats = useMemo(() => {
    if (!examData?.results) return { total: 0, normal: 0, altered: 0 };
    
    return {
      total: examData.results.length,
      normal: examData.results.filter((r) => r.status === "normal").length,
      altered: examData.results.filter((r) => r.status !== "normal").length,
    };
  }, [examData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "normal":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Normal
          </Badge>
        );
      case "alto":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
            <TrendingUp className="w-3 h-3 mr-1" />
            Alto
          </Badge>
        );
      case "baixo":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
            <TrendingDown className="w-3 h-3 mr-1" />
            Baixo
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-white border border-gray-200">
        <DialogHeader className="bg-gradient-to-br from-gray-50 via-white to-gray-50 border-b-2 border-gray-100 -mx-6 -mt-6 px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl text-gray-900 font-bold">
            📊 Resultados do Exame
          </DialogTitle>
          {examData?.exam && (
            <div className="text-sm text-gray-600 space-y-1 mt-2">
              <p className="font-medium">
                {examData.exam.laboratory} | {new Date(examData.exam.exam_date).toLocaleDateString("pt-BR")}
              </p>
              <p className="text-gray-500">
                {stats.total} biomarcadores | {stats.normal} normais | {stats.altered} alterados
              </p>
            </div>
          )}
        </DialogHeader>

        <Tabs defaultValue="results" className="flex-1 overflow-hidden flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 border border-gray-200">
            <TabsTrigger value="results" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600 font-medium">
              📊 Resultados
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600 font-medium">
              🧠 Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="flex-1 overflow-hidden flex flex-col space-y-4 mt-4">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar biomarcador..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="cardiovascular">Cardiovascular</SelectItem>
                  <SelectItem value="metabolico">Metabólico</SelectItem>
                  <SelectItem value="hematologico">Hematológico</SelectItem>
                  <SelectItem value="hormonal">Hormonal</SelectItem>
                  <SelectItem value="renal">Renal</SelectItem>
                  <SelectItem value="hepatico">Hepático</SelectItem>
                  <SelectItem value="minerais">Minerais/Vitaminas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="normal">Apenas normais</SelectItem>
                  <SelectItem value="altered">Apenas alterados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabela */}
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-white">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200 z-10">
                    <TableRow>
                      <TableHead className="text-gray-900 font-bold">Biomarcador</TableHead>
                      <TableHead className="text-right text-gray-900 font-bold">Valor</TableHead>
                      <TableHead className="text-right text-gray-900 font-bold">Referência</TableHead>
                      <TableHead className="text-center text-gray-900 font-bold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedResults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                          Nenhum resultado encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupedResults.map(([category, results]) => (
                        <>
                          {/* Linha separadora de categoria */}
                          <TableRow key={`category-${category}`} className="bg-blue-50 border-y-2 border-blue-200">
                            <TableCell colSpan={4} className="py-3 px-6">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-6 bg-blue-500 rounded-full" />
                                <span className="font-bold text-blue-700 uppercase tracking-wider text-sm">
                                  {category}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          {/* Biomarcadores da categoria (ordenados) */}
                          {results
                            .sort((a, b) => {
                              const orderA = getBiomarkerOrder(category, a.biomarker_name);
                              const orderB = getBiomarkerOrder(category, b.biomarker_name);
                              return orderA - orderB;
                            })
                            .map((result) => (
                              <TableRow key={result.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <TableCell className="font-medium text-gray-900">
                                  {result.biomarker_name}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="text-gray-900 font-mono">
                                    {result.value}
                                  </span>
                                  {result.unit && (
                                    <span className="text-gray-500 ml-1 text-xs">
                                      {result.unit}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className={`font-mono text-sm ${
                                    result.reference_min !== null && result.reference_max !== null
                                      ? 'text-gray-600'
                                      : 'text-gray-400 italic'
                                  }`}>
                                    {result.reference_min !== null && result.reference_max !== null
                                      ? `${result.reference_min} - ${result.reference_max}`
                                      : "N/A"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  {getStatusBadge(result.status)}
                                </TableCell>
                              </TableRow>
                            ))
                          }
                        </>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="text-xs text-gray-600 text-center">
              Mostrando {filteredResults.length} de {stats.total} biomarcadores
            </div>
          </TabsContent>

          <TabsContent value="insights" className="flex-1 overflow-auto mt-4">
            {examData?.exam && !examData.exam.health_score && (
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="py-8 text-center">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    Insights Clínicos Não Gerados
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                    Os biomarcadores foram extraídos com sucesso. Clique abaixo para gerar uma análise clínica detalhada com IA.
                  </p>
                  <Button 
                    onClick={async () => {
                      if (examId) {
                        const result = await analyzeExam(examId);
                        if (result) {
                          queryClient.invalidateQueries({ queryKey: ["exam-results", examId] });
                        }
                      }
                    }} 
                    disabled={analyzing}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-5 w-5" />
                        Gerar Análise Clínica
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {examData?.exam && examData.exam.health_score && (
              <ExamInsightsPanel exam={examData.exam as unknown as ExamWithInsights} />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
