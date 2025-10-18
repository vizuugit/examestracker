import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Search, TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import { categorizeBiomarker, getCategoryColor } from "@/utils/biomarkerCategories";

interface ExamResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string | null;
}

export function ExamResultsDialog({ open, onOpenChange, examId }: ExamResultsDialogProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

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
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Normal
          </Badge>
        );
      case "alto":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <TrendingUp className="w-3 h-3 mr-1" />
            Alto
          </Badge>
        );
      case "baixo":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            📊 Resultados do Exame
          </DialogTitle>
          {examData?.exam && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                {examData.exam.laboratory} | {new Date(examData.exam.exam_date).toLocaleDateString("pt-BR")}
              </p>
              <p>
                {stats.total} biomarcadores | {stats.normal} normais | {stats.altered} alterados
              </p>
            </div>
          )}
        </DialogHeader>

        <Tabs defaultValue="results" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="results">📊 Resultados</TabsTrigger>
            <TabsTrigger value="insights">🧠 Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="flex-1 overflow-hidden flex flex-col space-y-4 mt-4">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar biomarcador..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
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
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="normal">Apenas normais</SelectItem>
                  <SelectItem value="altered">Apenas alterados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabela */}
            <div className="flex-1 overflow-auto border rounded-lg">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[30%]">Biomarcador</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Referência</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Categoria</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhum resultado encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredResults.map((result) => {
                        const category = categorizeBiomarker(result.biomarker_name);
                        const categoryColor = getCategoryColor(category);
                        
                        return (
                          <TableRow key={result.id}>
                            <TableCell className="font-medium">
                              {result.biomarker_name}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-mono">
                                {result.value} {result.unit}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {result.reference_min && result.reference_max
                                ? `${result.reference_min} - ${result.reference_max}`
                                : "N/A"}
                            </TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(result.status)}
                            </TableCell>
                            <TableCell>
                              <span
                                className="inline-block px-2 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: `${categoryColor}20`,
                                  color: categoryColor,
                                  borderColor: `${categoryColor}40`,
                                  borderWidth: "1px",
                                }}
                              >
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Mostrando {filteredResults.length} de {stats.total} biomarcadores
            </div>
          </TabsContent>

          <TabsContent value="insights" className="flex-1 overflow-auto mt-4">
            {examData?.exam && <ExamInsightsPanel exam={examData.exam as unknown as ExamWithInsights} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
