import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, ReferenceArea } from 'recharts';
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
    fullDate: format(new Date(d.exam_date), 'dd/MM/yyyy', { locale: ptBR }),
    laboratory: d.laboratory
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'alto':
      case 'crítico':
        return 'hsl(var(--destructive))';
      case 'baixo':
        return 'hsl(var(--warning))';
      default:
        return 'hsl(var(--chart-1))';
    }
  };

  const chartConfig = {
    value: {
      label: biomarkerName,
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-xl text-white">{biomarkerName}</CardTitle>
        <CardDescription className="text-base text-white/70">
          Evolução ao longo do tempo {unit && `(${unit})`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              
              <XAxis 
                dataKey="date" 
                className="text-sm"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                height={60}
              />
              
              <YAxis 
                className="text-sm"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={60}
              />
              
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-xl">
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">Data:</span>
                            <span className="text-sm font-medium">{data.fullDate}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">Valor:</span>
                            <span className="text-sm font-bold">{data.value} {unit}</span>
                          </div>
                          {data.laboratory && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm text-muted-foreground">Lab:</span>
                              <span className="text-sm">{data.laboratory}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <span className={`text-sm font-medium ${
                              data.status === 'alto' || data.status === 'crítico' 
                                ? 'text-destructive' 
                                : data.status === 'baixo'
                                ? 'text-yellow-500'
                                : 'text-green-500'
                            }`}>
                              {data.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              {/* Área sombreada da faixa de referência */}
              {referenceMin !== null && referenceMax !== null && (
                <ReferenceArea
                  y1={referenceMin}
                  y2={referenceMax}
                  fill="hsl(var(--primary))"
                  fillOpacity={0.1}
                  label={{ value: 'Faixa Normal', position: 'insideTopRight', fill: 'hsl(var(--muted-foreground))' }}
                />
              )}
              
              {referenceMax && (
                <ReferenceLine 
                  y={referenceMax} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ 
                    value: `Máx: ${referenceMax}`, 
                    position: 'right', 
                    fill: 'hsl(var(--destructive))',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}
                />
              )}
              
              {referenceMin && (
                <ReferenceLine 
                  y={referenceMin} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ 
                    value: `Mín: ${referenceMin}`, 
                    position: 'right', 
                    fill: 'hsl(var(--destructive))',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}
                />
              )}
              
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const color = getStatusColor(payload.status);
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill={color}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ 
                  r: 8,
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 3
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
