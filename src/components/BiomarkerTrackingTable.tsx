import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, TrendingUp, TrendingDown, Minus, AlertCircle, Pencil, FileText, FileSpreadsheet } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ExamDateEditDialog } from './ExamDateEditDialog';
import { BiomarkerEditDialog } from './BiomarkerEditDialog';
import { formatBiomarkerValue } from '@/utils/valueFormatter';
import { combineLeukocyteValues, isLeukocyteType } from '@/utils/leukocyteFormatter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
// Ordenação agora vem do backend via category_order e biomarker_order

interface BiomarkerValue {
  result_id: string;
  exam_id: string;
  exam_date: string;
  value: string;
  value_numeric: number | null;
  status: 'normal' | 'alto' | 'baixo';
  manually_corrected?: boolean;
  percentValue?: number | string | null;
}

interface BiomarkerRow {
  biomarker_name: string;
  unit: string | null;
  reference_min: number | null;
  reference_max: number | null;
  category: string;
  values: BiomarkerValue[];
}

interface BiomarkerTrackingTableProps {
  patientId: string;
  data: BiomarkerRow[];
  examDates: string[];
  patientName?: string;
  initialCategory?: string;
}

export function BiomarkerTrackingTable({ patientId, data, examDates, patientName, initialCategory }: BiomarkerTrackingTableProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory || 'all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<{ id: string; date: string; isEstimated: boolean } | null>(null);
  const [biomarkerEditOpen, setBiomarkerEditOpen] = useState(false);
  const [selectedBiomarker, setSelectedBiomarker] = useState<{
    result_id: string;
    exam_id: string;
    biomarker_name: string;
    value: string;
    value_numeric: number | null;
    unit: string | null;
    reference_min: number | null;
    reference_max: number | null;
    status: 'normal' | 'alto' | 'baixo' | 'crítico';
  } | null>(null);

  // Obter categorias únicas
  const categories = Array.from(new Set(data.map(d => d.category).filter(Boolean)));

  // Filtrar dados por categoria
  const filteredData = categoryFilter === 'all' 
    ? data 
    : data.filter(d => d.category === categoryFilter);

  // Exportar para PDF
  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    
    // Cabeçalho
    doc.setFontSize(18);
    doc.setTextColor(0, 146, 204); // rest-blue
    doc.text('HealthTrack - Relatório de Acompanhamento', 14, 20);
    
    // Dados do paciente
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    if (patientName) {
      doc.text(`Paciente: ${patientName}`, 14, 30);
    }
    doc.text(`Data de Emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 37);
    
    // Preparar dados da tabela
    const headers = [
      'Biomarcador',
      ...examDates.map(d => format(new Date(d), 'dd/MM/yy', { locale: ptBR })),
      'Referência'
    ];

    const rows = filteredData.map(row => {
      const biomarkerWithUnit = row.unit 
        ? `${row.biomarker_name} (${row.unit})`
        : row.biomarker_name;
      
      const refText = row.reference_min !== null && row.reference_max !== null
        ? `${formatBiomarkerValue(row.reference_min, row.biomarker_name, row.unit)}-${formatBiomarkerValue(row.reference_max, row.biomarker_name, row.unit)}`
        : '-';
      
      const values = examDates.map(dateKey => {
        const [examId] = dateKey?.split('|') || [];
        if (!examId) return '-';
        const value = row.values.find(v => v.exam_id === examId);
        if (!value) return '-';
        
        // Combinar valores absolutos e percentuais para leucócitos
        if (value.percentValue && isLeukocyteType(row.biomarker_name)) {
          return combineLeukocyteValues(
            value.value_numeric ?? value.value,
            value.percentValue,
            row.biomarker_name
          );
        }
        
        return value.value;
      });

      return [
        biomarkerWithUnit,
        ...values,
        refText
      ];
    });
    
    // Tabela
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 45,
      theme: 'grid',
      headStyles: { 
        fillColor: [0, 146, 204], // rest-blue
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: { 
        fillColor: [245, 245, 245] 
      },
      styles: {
        cellPadding: 3,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 50 }, // Biomarcador (mais largo para incluir unidade)
      }
    });
    
    doc.save(`acompanhamento-${patientName || 'paciente'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Exportar para Excel
  const exportToExcel = () => {
    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Agrupar dados por categoria
    const groupedData = filteredData.reduce((acc, row) => {
      const category = row.category || 'Outros';
      if (!acc[category]) acc[category] = [];
      acc[category].push(row);
      return acc;
    }, {} as Record<string, BiomarkerRow[]>);

    // Preparar dados principais
    const excelData: any[] = [];
    
    // Cabeçalho de metadados
    excelData.push(['HealthTrack - Relatório de Acompanhamento']);
    excelData.push([`Paciente: ${patientName || 'N/A'}`]);
    excelData.push([`Data de Emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`]);
    excelData.push([`Categoria: ${categoryFilter === 'all' ? 'Todas' : categoryFilter}`]);
    excelData.push([]); // Linha vazia

    // Cabeçalhos da tabela
    const headers = [
      'Biomarcador',
      ...examDates.map(dateKey => {
        const [, date] = dateKey.split('|');
        return date ? format(new Date(date), 'dd/MM/yy', { locale: ptBR }) : '';
      }),
      'Referência',
      'Tendência'
    ];
    excelData.push(headers);

    // Dados por categoria - ordenar usando category_order do backend
    const categories = Object.keys(groupedData).sort((a, b) => {
      const categoryA = groupedData[a][0];
      const categoryB = groupedData[b][0];
      const orderA = categoryA?.category_order ?? 999;
      const orderB = categoryB?.category_order ?? 999;
      return orderA - orderB;
    });

    categories.forEach(category => {
      // Linha de categoria
      const categoryRow = new Array(headers.length).fill('');
      categoryRow[0] = category.toUpperCase();
      excelData.push(categoryRow);

      // Biomarcadores da categoria - ordenar usando biomarker_order do backend
      const sortedBiomarkers = groupedData[category].sort((a, b) => {
        const orderA = a.biomarker_order ?? 999;
        const orderB = b.biomarker_order ?? 999;
        return orderA - orderB;
      });
      
      sortedBiomarkers.forEach(row => {
        const biomarkerWithUnit = row.unit 
          ? `${row.biomarker_name} (${row.unit})`
          : row.biomarker_name;
        
        const refText = row.reference_min !== null && row.reference_max !== null
          ? `${formatBiomarkerValue(row.reference_min, row.biomarker_name, row.unit)}-${formatBiomarkerValue(row.reference_max, row.biomarker_name, row.unit)}`
          : '-';
        
        const values = examDates.map(dateKey => {
          const [examId] = dateKey.split('|');
          const value = row.values.find(v => v.exam_id === examId);
          if (!value) return '-';
          
          // Combinar valores absolutos e percentuais para leucócitos
          if (value.percentValue && isLeukocyteType(row.biomarker_name)) {
            return combineLeukocyteValues(
              value.value_numeric ?? value.value,
              value.percentValue,
              row.biomarker_name
            );
          }
          
          return value?.value_numeric !== null ? value?.value_numeric : (value?.value || '-');
        });

        const trend = getTrend(row.values);
        const trendText = trend 
          ? (trend.type === 'stable' ? 'Estável' : `${trend.change > 0 ? '+' : ''}${trend.change.toFixed(1)}%`)
          : 'N/A';

        excelData.push([
          biomarkerWithUnit,
          ...values,
          refText,
          trendText
        ]);
      });
    });

    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Aplicar larguras de coluna
    const colWidths = [
      { wch: 30 }, // Biomarcador (mais largo para incluir unidade)
      ...examDates.map(() => ({ wch: 12 })), // Datas
      { wch: 15 }, // Referência
      { wch: 12 }  // Tendência
    ];
    ws['!cols'] = colWidths;

    // Mesclar células do cabeçalho
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // Título
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }, // Paciente
      { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } }, // Data
      { s: { r: 3, c: 0 }, e: { r: 3, c: headers.length - 1 } }  // Categoria
    ];

    // Adicionar linhas de mesclagem para categorias
    let currentRow = 6; // Começa após cabeçalhos
    categories.forEach(category => {
      ws['!merges']?.push({ 
        s: { r: currentRow, c: 0 }, 
        e: { r: currentRow, c: headers.length - 1 } 
      });
      currentRow += groupedData[category].length + 1;
    });

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Biomarcadores');

    // Salvar arquivo
    XLSX.writeFile(wb, `acompanhamento-${patientName || 'paciente'}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  // Calcular tendência
  const getTrend = (values: BiomarkerValue[]) => {
    if (values.length < 2) return null;
    
    const sortedValues = [...values].sort((a, b) => 
      new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
    );
    
    const last = sortedValues[sortedValues.length - 1]?.value_numeric;
    const previous = sortedValues[sortedValues.length - 2]?.value_numeric;
    
    if (last === null || previous === null || previous === 0) return null;
    
    const percentChange = ((last - previous) / previous) * 100;
    
    if (Math.abs(percentChange) < 5) {
      return { type: 'stable', change: percentChange };
    }
    
    return { 
      type: percentChange > 0 ? 'up' : 'down', 
      change: percentChange 
    };
  };

  // Cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-400 font-semibold';
      case 'alto':
        return 'text-yellow-400 font-semibold';
      case 'baixo':
        return 'text-yellow-400 font-semibold';
      default:
        return 'text-white/50';
    }
  };

  // Handler para editar biomarcador
  const handleEditBiomarker = (row: BiomarkerRow, value: BiomarkerValue) => {
    setSelectedBiomarker({
      result_id: value.result_id,
      exam_id: value.exam_id,
      biomarker_name: row.biomarker_name,
      value: value.value,
      value_numeric: value.value_numeric,
      unit: row.unit,
      reference_min: row.reference_min,
      reference_max: row.reference_max,
      status: value.status as 'normal' | 'alto' | 'baixo' | 'crítico',
    });
    setBiomarkerEditOpen(true);
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-gray-50 via-white to-gray-50 border-b-2 border-gray-100 px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              {patientName || 'Histórico Completo'}
            </CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Acompanhamento longitudinal de todos os biomarcadores
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-12 bg-rest-blue hover:bg-rest-cyan text-white font-semibold px-6 rounded-xl shadow-lg">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer rounded-lg py-3">
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer rounded-lg py-3">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exportar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200 hover:bg-gray-50">
                <TableHead className="sticky left-0 z-20 bg-gray-50 text-gray-900 font-bold text-xs uppercase tracking-wider py-5 px-6">
                  Biomarcador
                </TableHead>
                {examDates.map((dateKey, index) => {
                  const [examId, date, source] = dateKey.split('|');
                  if (!date || date === 'null' || !examId) return null;
                  
                  const isEstimated = source === 'estimated';
                  const parsedDate = new Date(date);
                  if (isNaN(parsedDate.getTime())) return null;
                  
                  return (
                    <TableHead 
                      key={examId} 
                      className="text-center text-gray-900 font-bold text-sm uppercase tracking-wide min-w-[140px] cursor-pointer hover:bg-gray-200 transition-colors relative group"
                    >
                      <TooltipProvider>
                        <div className="flex items-center justify-center gap-1">
                          <span>{format(parsedDate, 'dd/MM/yy', { locale: ptBR })}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 hover:bg-white/10"
                                onClick={() => {
                                  setSelectedExam({ id: examId, date, isEstimated });
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar data do exame</p>
                            </TooltipContent>
                          </Tooltip>
                          {isEstimated && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Data estimada (baseada no upload)</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TooltipProvider>
                    </TableHead>
                  );
                })}
                <TableHead className="text-center text-gray-900 font-bold text-sm uppercase tracking-wide min-w-[150px]">
                  Referência
                </TableHead>
                <TableHead className="text-center text-gray-900 font-bold text-sm uppercase tracking-wide min-w-[100px]">
                  Tendência
                </TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {(() => {
                // Agrupar dados por categoria
                const groupedData = filteredData.reduce((acc, row) => {
                  const category = row.category || 'Outros';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(row);
                  return acc;
                }, {} as Record<string, BiomarkerRow[]>);

                // Ordenar categorias usando category_order do backend
                const categories = Object.keys(groupedData).sort((a, b) => {
                  const categoryA = groupedData[a][0];
                  const categoryB = groupedData[b][0];
                  const orderA = categoryA?.category_order ?? 999;
                  const orderB = categoryB?.category_order ?? 999;
                  return orderA - orderB;
                });

                return categories.map((category) => (
                  <>
                    {/* Header de Categoria */}
                    <TableRow 
                      key={`category-${category}`}
                      className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-blue/90 hover:to-rest-cyan/90 relative"
                    >
                      <TableCell 
                        colSpan={examDates.length + 3}
                        className="sticky left-0 z-10 font-bold text-white uppercase tracking-wide text-sm py-3 px-6 border-y-2 border-transparent"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-white rounded-full" />
                          {category}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Biomarcadores da categoria - ordenar usando biomarker_order do backend */}
                    {groupedData[category]
                      .sort((a, b) => {
                        const orderA = a.biomarker_order ?? 999;
                        const orderB = b.biomarker_order ?? 999;
                        return orderA - orderB;
                      })
                      .map((row) => {
                      const trend = getTrend(row.values);
                      
                      return (
                        <TableRow 
                          key={row.biomarker_name}
                          className="border-b border-gray-100 hover:bg-rest-blue/10 transition-colors"
                        >
                          <TableCell className="sticky left-0 z-10 bg-white hover:bg-rest-blue/10 font-semibold text-gray-900 border-r border-gray-200">
                            <div className="flex flex-col">
                              <span>{row.biomarker_name}</span>
                              {row.unit && (
                                <span className="text-[10px] text-gray-500 font-normal">
                                  ({row.unit})
                                </span>
                              )}
                            </div>
                          </TableCell>
                          
                          {examDates.map((dateKey) => {
                            const [examId] = dateKey.split('|');
                            const value = row.values.find(v => v.exam_id === examId);
                            
                            return (
                              <TableCell 
                                key={examId}
                                className={cn(
                                  "min-w-[140px] text-center font-semibold cursor-pointer hover:bg-rest-blue/10 transition-colors group relative",
                                  value && value.status === 'normal' && "text-green-700 font-bold",
                                  value && (value.status === 'alto' || value.status === 'baixo') && "text-amber-700 font-bold",
                                  !value && "text-gray-400"
                                )}
                                onClick={() => value && handleEditBiomarker(row, value)}
                              >
                                {value ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="whitespace-nowrap">
                                      {value.percentValue && isLeukocyteType(row.biomarker_name)
                                        ? combineLeukocyteValues(
                                            value.value_numeric ?? value.value, 
                                            value.percentValue,
                                            row.biomarker_name
                                          )
                                        : formatBiomarkerValue(
                                            value.value_numeric ?? value.value, 
                                            row.biomarker_name, 
                                            row.unit
                                          )
                                      }
                                    </span>
                                    {value.manually_corrected && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge className="ml-1 text-[8px] bg-green-500 hover:bg-green-600">✓</Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Corrigido manualmente</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                  </div>
                                ) : (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-gray-300 text-sm">-</span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Biomarcador não medido neste exame</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </TableCell>
                            );
                          })}
                          
                          
                          <TableCell className="text-gray-600 text-sm font-medium text-center">
                            {row.reference_min !== null && row.reference_max !== null
                              ? `${formatBiomarkerValue(row.reference_min, row.biomarker_name, row.unit)}-${formatBiomarkerValue(row.reference_max, row.biomarker_name, row.unit)}`
                              : <span className="text-gray-400 italic">N/A</span>}
                          </TableCell>
                          
                          <TableCell className="text-center">
                            {trend ? (
                              <div className={cn(
                                "flex items-center justify-center gap-1",
                                trend.type === 'stable' && "text-muted-foreground",
                                trend.type === 'up' && "text-medical-critical",
                                trend.type === 'down' && "text-medical-success"
                              )}>
                                {trend.type === 'up' && <TrendingUp className="w-4 h-4" />}
                                {trend.type === 'down' && <TrendingDown className="w-4 h-4" />}
                                {trend.type === 'stable' && <Minus className="w-4 h-4" />}
                                <span className="text-sm font-medium">
                                  {trend.type === 'stable' 
                                    ? 'Estável' 
                                    : `${Math.abs(trend.change).toFixed(1)}%`}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                ));
              })()}
            </TableBody>
          </Table>
        </div>
        
        {examDates.length > 5 && (
          <div className="md:hidden text-center text-xs text-rest-gray py-3 border-t border-border">
            ← Arraste para ver mais datas →
          </div>
        )}
      </CardContent>

      {selectedExam && (
        <ExamDateEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          examId={selectedExam.id}
          currentDate={selectedExam.date}
          isEstimated={selectedExam.isEstimated}
        />
      )}

      {selectedBiomarker && (
        <BiomarkerEditDialog
          open={biomarkerEditOpen}
          onOpenChange={setBiomarkerEditOpen}
          patientId={patientId}
          biomarker={selectedBiomarker}
          onSuccess={() => {
            // A query será invalidada automaticamente pelo hook
          }}
        />
      )}
    </Card>
  );
}
