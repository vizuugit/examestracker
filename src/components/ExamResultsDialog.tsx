import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Search, TrendingUp, TrendingDown, CheckCircle, Brain, FileDown, FileSpreadsheet, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
// Ordenação agora vem do backend via category_order e biomarker_order
import { useExamAnalysis } from "@/hooks/useExamAnalysis";
import { ExamInsightsPanel } from "@/components/ExamInsightsPanel";
import type { ExamWithInsights } from "@/types/exam-insights";
import { getBiomarkerCategory } from "@/services/biomarkerCategoryService";
import { toast } from "sonner";
import { AddMissingBiomarkerDialog } from "@/components/AddMissingBiomarkerDialog";

interface ExamResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string | null;
}

export function ExamResultsDialog({ open, onOpenChange, examId }: ExamResultsDialogProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addBiomarkerOpen, setAddBiomarkerOpen] = useState(false);
  const queryClient = useQueryClient();
  const { analyzeExam, analyzing } = useExamAnalysis();

  const handleGenerateInsights = async () => {
    if (!examId) return;
    
    const result = await analyzeExam(examId);
    
    if (result) {
      // Invalidar query para recarregar dados atualizados
      queryClient.invalidateQueries({ queryKey: ["exam-results", examId] });
    }
  };

  // Exportar para PDF
  const exportToPDF = () => {
    if (!examData) return;

    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(16);
    doc.setTextColor(0, 90, 156); // rest-blue
    doc.text('HealthTrack - Resultados do Exame', 14, 20);
    
    // Dados do exame
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    if (examData.patientName) {
      doc.text(`Paciente: ${examData.patientName}`, 14, 30);
    }
    if (examData.exam) {
      doc.text(`Laboratório: ${examData.exam.laboratory}`, 14, 37);
      doc.text(`Data do Exame: ${format(new Date(examData.exam.exam_date), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 44);
    }
    doc.text(`Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 51);
    
    let yPosition = 60;

    // Usar estrutura nova ou fallback
    if (examData.categorias) {
      // Estrutura nova: usar categorias do backend
      examData.categorias.forEach((categoria: any) => {
        // Cabeçalho da categoria
        doc.setFillColor(0, 90, 156);
        doc.rect(14, yPosition, 182, 8, 'F');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(categoria.nome.toUpperCase(), 16, yPosition + 6);
        yPosition += 12;

        // Tabela de biomarcadores
        const biomarkerRows = categoria.biomarcadores.map((bio: any) => [
          bio.nome,
          bio.resultado,
          bio.unidade || '-',
          bio.referencia_min !== null && bio.referencia_max !== null
            ? `${bio.referencia_min} - ${bio.referencia_max}`
            : '-',
          bio.status === 'normal' ? 'Normal' : 
          bio.status === 'alto' ? 'Alto' : 
          bio.status === 'baixo' ? 'Baixo' : bio.status
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Biomarcador', 'Valor', 'Unidade', 'Referência', 'Status']],
          body: biomarkerRows,
          theme: 'striped',
          headStyles: { 
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: { fontSize: 8 },
          margin: { left: 14, right: 14 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 8;
        
        // Nova página se necessário
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
      });
    } else if (examData.results) {
      // Fallback: estrutura antiga
      const groupedByCategory = groupedResults;
      
      groupedByCategory.forEach(([category, results]: [string, any[]]) => {
        // Cabeçalho da categoria
        doc.setFillColor(0, 90, 156);
        doc.rect(14, yPosition, 182, 8, 'F');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(category.toUpperCase(), 16, yPosition + 6);
        yPosition += 12;

        const biomarkerRows = results.map(result => [
          result.biomarker_name,
          result.value,
          result.unit || '-',
          result.reference_min !== null && result.reference_max !== null
            ? `${result.reference_min} - ${result.reference_max}`
            : '-',
          result.status === 'normal' ? 'Normal' : 
          result.status === 'alto' ? 'Alto' : 
          result.status === 'baixo' ? 'Baixo' : result.status
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Biomarcador', 'Valor', 'Unidade', 'Referência', 'Status']],
          body: biomarkerRows,
          theme: 'striped',
          headStyles: { 
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: { fontSize: 8 },
          margin: { left: 14, right: 14 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 8;
        
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
      });
    }
    
    const fileName = `exame-${examData.patientName || 'paciente'}-${format(new Date(examData.exam?.exam_date || new Date()), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
    toast.success("PDF exportado com sucesso!");
  };

  // Exportar para Excel
  const exportToExcel = () => {
    if (!examData) return;

    const wb = XLSX.utils.book_new();
    const excelData: any[] = [];
    
    // Cabeçalho
    excelData.push(['HealthTrack - Resultados do Exame']);
    excelData.push([`Paciente: ${examData.patientName || 'N/A'}`]);
    excelData.push([`Laboratório: ${examData.exam?.laboratory || 'N/A'}`]);
    excelData.push([`Data do Exame: ${examData.exam?.exam_date ? format(new Date(examData.exam.exam_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}`]);
    excelData.push([`Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`]);
    excelData.push([]);

    // Cabeçalhos da tabela
    const headers = ['Categoria', 'Biomarcador', 'Valor', 'Unidade', 'Referência', 'Status'];
    excelData.push(headers);

    // Dados
    if (examData.categorias) {
      // Estrutura nova: já organizada
      examData.categorias.forEach((categoria: any) => {
        categoria.biomarcadores.forEach((bio: any, index: number) => {
          const refText = bio.referencia_min !== null && bio.referencia_max !== null
            ? `${bio.referencia_min} - ${bio.referencia_max}`
            : '-';
          
          const statusText = bio.status === 'normal' ? 'Normal' : 
                           bio.status === 'alto' ? 'Alto' : 
                           bio.status === 'baixo' ? 'Baixo' : bio.status;

          excelData.push([
            index === 0 ? categoria.nome : '', // Categoria só na primeira linha
            bio.nome,
            bio.resultado,
            bio.unidade || '-',
            refText,
            statusText
          ]);
        });
      });
    } else if (examData.results) {
      // Fallback
      groupedResults.forEach(([category, results]: [string, any[]]) => {
        results.forEach((result, index) => {
          const refText = result.reference_min !== null && result.reference_max !== null
            ? `${result.reference_min} - ${result.reference_max}`
            : '-';
          
          const statusText = result.status === 'normal' ? 'Normal' : 
                           result.status === 'alto' ? 'Alto' : 
                           result.status === 'baixo' ? 'Baixo' : result.status;

          excelData.push([
            index === 0 ? category : '',
            result.biomarker_name,
            result.value,
            result.unit || '-',
            refText,
            statusText
          ]);
        });
      });
    }

    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Larguras de coluna
    ws['!cols'] = [
      { wch: 20 }, // Categoria
      { wch: 30 }, // Biomarcador
      { wch: 12 }, // Valor
      { wch: 10 }, // Unidade
      { wch: 18 }, // Referência
      { wch: 12 }  // Status
    ];

    // Mesclar células do cabeçalho
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 5 } }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');
    
    const fileName = `exame-${examData.patientName || 'paciente'}-${format(new Date(examData.exam?.exam_date || new Date()), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Excel exportado com sucesso!");
  };

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

      // Buscar nome do paciente
      let patientName = exam.patient_name_extracted || null;
      if (exam.patient_id) {
        const { data: patient } = await supabase
          .from("patients")
          .select("full_name")
          .eq("id", exam.patient_id)
          .single();
        
        if (patient) {
          patientName = patient.full_name;
        }
      }

      // ✅ NOVO: Verificar se há categorias no raw_aws_response
      const rawResponse = exam.raw_aws_response as any;
      const categorias = rawResponse?.categorias || [];
      
      // Se houver categorias, usar estrutura nova. Senão, buscar do banco (fallback)
      if (categorias.length > 0) {
        return { exam, categorias, patientName };
      }

      // Fallback: buscar do banco antigo
      const { data: results, error: resultsError } = await supabase
        .from("exam_results")
        .select("*")
        .eq("exam_id", examId)
        .order("biomarker_name");

      if (resultsError) throw resultsError;

      return { exam, results, patientName };
    },
    enabled: !!examId && open,
  });

  // ✅ NOVO: Filtrar usando estrutura de categorias
  const filteredCategories = useMemo(() => {
    if (examData?.categorias) {
      // Usar estrutura nova do backend
      return examData.categorias
        .map(categoria => ({
          ...categoria,
          biomarcadores: categoria.biomarcadores.filter((bio: any) => {
            // Filtro de categoria
            if (categoryFilter !== "all" && categoria.nome !== categoryFilter) return false;
            
            // Filtro de status
            if (statusFilter === "normal" && bio.status !== "normal") return false;
            if (statusFilter === "altered" && bio.status === "normal") return false;
            
            // Busca por nome
            if (searchQuery && !bio.nome.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            
            return true;
          })
        }))
        .filter(cat => cat.biomarcadores.length > 0);
    }
    
    // Fallback: usar estrutura antiga
    if (!examData?.results) return [];

    return examData.results.filter((result) => {
      if (categoryFilter !== "all") {
        const resultCategory = getBiomarkerCategory(result.biomarker_name, result.category);
        if (resultCategory !== categoryFilter) return false;
      }

      if (statusFilter === "normal" && result.status !== "normal") return false;
      if (statusFilter === "altered" && result.status === "normal") return false;

      if (searchQuery && !result.biomarker_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [examData, categoryFilter, statusFilter, searchQuery]);

  // ✅ NOVO: Usar categorias já organizadas pelo backend
  const groupedResults = useMemo(() => {
    if (examData?.categorias) {
      // Estrutura nova: já vem organizada
      return filteredCategories.map(cat => [cat.nome, cat.biomarcadores]);
    }
    
    // Fallback: agrupar manualmente
    const grouped = filteredCategories.reduce((acc: any, result: any) => {
      const category = getBiomarkerCategory(result.biomarker_name, result.category);
      if (!acc[category]) acc[category] = [];
      acc[category].push(result);
      return acc;
    }, {});
    
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [examData, filteredCategories]);

  const stats = useMemo(() => {
    if (examData?.categorias) {
      // Calcular stats da estrutura nova
      const allBiomarkers = examData.categorias.flatMap((cat: any) => cat.biomarcadores);
      return {
        total: allBiomarkers.length,
        normal: allBiomarkers.filter((b: any) => b.status === "normal").length,
        altered: allBiomarkers.filter((b: any) => b.status !== "normal").length,
      };
    }
    
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

  // Extrair categorias únicas
  const categories = useMemo(() => {
    if (examData?.categorias) {
      return examData.categorias.map((cat: any) => cat.nome);
    }
    if (!examData?.results) return [];
    return Array.from(new Set(examData.results.map(r => getBiomarkerCategory(r.biomarker_name, r.category))));
  }, [examData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-white border border-gray-200">
        {/* Header igual ao BiomarkerTrackingTable */}
        <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 border-b-2 border-gray-100 -mx-6 -mt-6 px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {examData?.patientName || "Resultados do Exame"}
              </h2>
              {examData?.exam && (
                <div className="space-y-1">
                  <p className="text-gray-600 text-base">
                    {examData.exam.laboratory} | {new Date(examData.exam.exam_date).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {stats.total} biomarcadores | {stats.normal} normais | {stats.altered} alterados
                  </p>
                </div>
              )}
            </div>

            {/* Filtros e ações no header (lado direito) */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar biomarcador..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[220px] h-12 bg-white border-2 border-gray-200 hover:border-rest-blue focus:border-rest-blue focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[220px] h-12 bg-white border-2 border-gray-200 hover:border-rest-blue rounded-xl font-semibold">
                  <div className="w-2 h-2 rounded-full bg-rest-blue mr-2" />
                  <SelectValue placeholder="Filtrar categoria" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-2xl">
                  <SelectItem value="all" className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rest-blue" />
                      Todas as Categorias
                    </div>
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="rounded-lg">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] h-12 bg-white border-2 border-gray-200 hover:border-rest-blue rounded-xl font-semibold">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-2xl">
                  <SelectItem value="all" className="rounded-lg">Todos os status</SelectItem>
                  <SelectItem value="normal" className="rounded-lg">Apenas normais</SelectItem>
                  <SelectItem value="altered" className="rounded-lg">Apenas alterados</SelectItem>
                </SelectContent>
              </Select>

              {/* Botões de exportação */}
              <Button
                onClick={exportToPDF}
                disabled={isLoading}
                variant="outline"
                className="h-12 border-2 border-gray-200 hover:border-rest-blue hover:bg-rest-blue/5 rounded-xl font-semibold transition-all"
              >
                <FileDown className="w-4 h-4 mr-2" />
                PDF
              </Button>

              <Button
                onClick={exportToExcel}
                disabled={isLoading}
                variant="outline"
                className="h-12 border-2 border-gray-200 hover:border-green-600 hover:bg-green-50 rounded-xl font-semibold transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>

              <Button
                onClick={() => setAddBiomarkerOpen(true)}
                disabled={!examId}
                variant="outline"
                className="h-12 border-2 border-gray-200 hover:bg-gradient-to-r hover:from-rest-blue hover:to-rest-cyan hover:text-white hover:border-transparent rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Biomarcador
              </Button>

              <Button
                onClick={handleGenerateInsights}
                disabled={analyzing || isLoading}
                className="h-12 bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-blue/90 hover:to-rest-cyan/90 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {analyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Gerando Insights...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Gerar Insights
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs para Resultados e Insights */}
        <Tabs defaultValue="resultados" className="flex-1 overflow-hidden flex flex-col mt-4">
          <TabsList className="mx-6 mb-4">
            <TabsTrigger value="resultados">Resultados</TabsTrigger>
            <TabsTrigger value="insights">Insights Clínicos</TabsTrigger>
          </TabsList>

          <TabsContent value="resultados" className="flex-1 overflow-hidden flex flex-col m-0">
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200 hover:bg-gray-50">
                      <TableHead className="text-gray-900 font-bold text-xs uppercase tracking-wider py-5 px-6">
                        Biomarcador
                      </TableHead>
                      <TableHead className="text-right text-gray-900 font-bold text-xs uppercase tracking-wider py-5 px-6">
                        Valor
                      </TableHead>
                      <TableHead className="text-right text-gray-900 font-bold text-xs uppercase tracking-wider py-5 px-6">
                        Referência
                      </TableHead>
                      <TableHead className="text-center text-gray-900 font-bold text-xs uppercase tracking-wider py-5 px-6">
                        Status
                      </TableHead>
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
                          <TableRow key={`category-${category}`} className="bg-gradient-to-r from-rest-blue to-rest-cyan border-y-2 border-blue-200">
                            <TableCell colSpan={4} className="py-3 px-6">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-6 bg-white rounded-full" />
                                <span className="font-bold text-white uppercase tracking-wider text-sm">
                                  {category}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          {/* Biomarcadores da categoria */}
                          {results.map((bio: any) => {
                            // Detectar se é estrutura nova ou antiga
                            const isNewStructure = !!examData?.categorias;
                            const biomarkerName = bio.nome || bio.biomarker_name;
                            const bioValue = bio.resultado || bio.value;
                            const bioUnit = bio.unidade || bio.unit;
                            
                            const bioRefText = isNewStructure
                              ? (bio.valor_referencia_texto ?? null)
                              : null;
                            
                            const bioRefMin = isNewStructure
                              ? (bio.valor_referencia_min ?? null)
                              : (bio.reference_min ?? null);
                            
                            const bioRefMax = isNewStructure
                              ? (bio.valor_referencia_max ?? null)
                              : (bio.reference_max ?? null);
                            
                            const bioStatus = bio.status;
                            const bioId = bio.id || `${category}-${biomarkerName}`;
                            
                            return (
                              <TableRow key={bioId} className="border-b border-gray-100 hover:bg-gray-50">
                                <TableCell className="py-4 px-6">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-gray-900">
                                      {biomarkerName}
                                    </span>
                                    {bioUnit && (
                                      <span className="text-[10px] text-gray-500 font-normal">
                                        ({bioUnit})
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right py-4 px-6">
                                  <span className="text-gray-900 font-mono">
                                    {bioValue}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right py-4 px-6">
                                  <span className={`font-mono text-sm ${
                                    bioRefText || (bioRefMin != null && bioRefMax != null)
                                      ? 'text-gray-600'
                                      : 'text-gray-400 italic'
                                  }`}>
                                    {bioRefText
                                      ? bioRefText
                                      : bioRefMin != null && bioRefMax != null
                                        ? `${bioRefMin} - ${bioRefMax}`
                                        : "N/A"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center py-4 px-6">
                                  {getStatusBadge(bioStatus)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="text-xs text-gray-600 text-center py-3 border-t border-gray-100">
              Mostrando {groupedResults.reduce((acc, [_, bios]) => acc + bios.length, 0)} de {stats.total} biomarcadores
            </div>
          </TabsContent>

          <TabsContent value="insights" className="flex-1 overflow-y-auto m-0 px-6">
            {examData?.exam?.clinical_analysis ? (
              <ExamInsightsPanel 
                exam={{
                  id: examData.exam.id,
                  exam_date: examData.exam.exam_date,
                  laboratory: examData.exam.laboratory,
                  health_score: examData.exam.health_score,
                  risk_category: examData.exam.risk_category,
                  clinical_analysis: examData.exam.clinical_analysis,
                  alerts: examData.exam.alerts,
                  trends: examData.exam.trends,
                  recommendations: examData.exam.recommendations,
                  total_biomarkers: examData.exam.total_biomarkers,
                  processing_status: examData.exam.processing_status,
                } as unknown as ExamWithInsights} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <Brain className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Nenhum Insight Gerado
                </h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  Clique no botão "Gerar Insights" para obter uma análise clínica completa deste exame.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Dialog para adicionar biomarcador ausente */}
      {examId && (
        <AddMissingBiomarkerDialog
          open={addBiomarkerOpen}
          onOpenChange={setAddBiomarkerOpen}
          examId={examId}
        />
      )}
    </Dialog>
  );
}
