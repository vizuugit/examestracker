import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BiomarkerDataPoint {
  exam_date: string;
  value_numeric: number;
  status: string;
  laboratory: string | null;
}

interface BiomarkerChartProps {
  biomarkerName: string;
  data: BiomarkerDataPoint[];
  unit: string | null;
  referenceMin: number | null;
  referenceMax: number | null;
}

export function BiomarkerChart({ 
  biomarkerName, 
  data, 
  unit, 
  referenceMin, 
  referenceMax 
}: BiomarkerChartProps) {
  const chartData = data.map(d => ({
    date: format(new Date(d.exam_date), 'dd/MM/yy', { locale: ptBR }),
    value: d.value_numeric,
    status: d.status,
    fullDate: format(new Date(d.exam_date), 'dd/MM/yyyy', { locale: ptBR })
  }));

  const chartConfig = {
    value: {
      label: biomarkerName,
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="text-lg">{biomarkerName}</CardTitle>
        <CardDescription>
          Evolução ao longo do tempo {unit && `(${unit})`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              
              {referenceMax && (
                <ReferenceLine 
                  y={referenceMax} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="3 3"
                  label={{ value: 'Máx', position: 'right', fill: 'hsl(var(--destructive))' }}
                />
              )}
              
              {referenceMin && (
                <ReferenceLine 
                  y={referenceMin} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="3 3"
                  label={{ value: 'Mín', position: 'right', fill: 'hsl(var(--destructive))' }}
                />
              )}
              
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
