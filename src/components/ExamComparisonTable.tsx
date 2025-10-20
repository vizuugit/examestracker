import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendIndicator } from './TrendIndicator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ExamResult {
  biomarker_name: string;
  value: string;
  value_numeric: number | null;
  unit: string | null;
  status: string;
  reference_min: number | null;
  reference_max: number | null;
}

interface ExamComparisonTableProps {
  exams: Array<{
    exam_date: string;
    results: ExamResult[];
  }>;
}

export function ExamComparisonTable({ exams }: ExamComparisonTableProps) {
  if (exams.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle>Comparação de Exames</CardTitle>
          <CardDescription>Nenhum exame disponível para comparação</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Pegar os 3 exames mais recentes
  const recentExams = exams.slice(-3);
  
  // Criar um conjunto único de biomarcadores
  const allBiomarkers = new Set<string>();
  recentExams.forEach(exam => {
    exam.results.forEach(result => {
      allBiomarkers.add(result.biomarker_name);
    });
  });

  const biomarkersList = Array.from(allBiomarkers).sort();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'normal':
        return 'text-green-500';
      case 'alto':
      case 'baixo':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle>Comparação de Exames</CardTitle>
        <CardDescription>
          Comparação dos últimos {recentExams.length} exames
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Biomarcador</TableHead>
                <TableHead className="text-center">Unidade</TableHead>
                <TableHead className="text-center">Referência</TableHead>
                {recentExams.map((exam, idx) => (
                  <TableHead key={idx} className="text-center">
                    {format(new Date(exam.exam_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableHead>
                ))}
                <TableHead className="text-center">Tendência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {biomarkersList.map(biomarker => {
                const values = recentExams.map(exam => 
                  exam.results.find(r => r.biomarker_name === biomarker)
                );
                
                const lastValue = values[values.length - 1];
                const previousValue = values[values.length - 2];

                const firstResult = values.find(v => v !== undefined);
                const referenceText = firstResult?.reference_min !== null && firstResult?.reference_max !== null
                  ? `${firstResult.reference_min}-${firstResult.reference_max}`
                  : '-';

                return (
                  <TableRow key={biomarker}>
                    <TableCell className="font-medium">{biomarker}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {firstResult?.unit || '-'}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {referenceText}
                    </TableCell>
                    {values.map((result, idx) => (
                      <TableCell key={idx} className="text-center">
                        {result ? (
                          <span className={cn("font-medium", getStatusColor(result.status))}>
                            {result.value}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      {lastValue && previousValue && lastValue.value_numeric && previousValue.value_numeric ? (
                        <TrendIndicator 
                          currentValue={lastValue.value_numeric}
                          previousValue={previousValue.value_numeric}
                          className="justify-center"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
