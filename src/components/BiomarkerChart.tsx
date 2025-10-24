import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, ReferenceArea } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity } from 'lucide-react';

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
  // Filtrar apenas valores numéricos válidos
  const validData = data.filter(d => d.value_numeric !== null && !isNaN(d.value_numeric));
  
  const chartData = validData.map(d => ({
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

  // Renderizar mensagem se não houver dados numéricos
  if (validData.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-xl text-white">{biomarkerName}</CardTitle>
          <CardDescription className="text-base text-white/70">
            Evolução ao longo do tempo {unit && `(${unit})`}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Activity className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <p className="text-white/60">
            Este biomarcador não possui valores numéricos para gráfico
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-xl text-white">{biomarkerName}</CardTitle>
        <CardDescription className="text-base text-white/70">
          Evolução ao longo do tempo {unit && `(${unit})`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <ChartContainer config={chartConfig} className="h-[300px] sm:h-[400px] lg:h-[500px] w-full max-w-full overflow-hidden">
          <ResponsiveContainer width="99%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 5, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              
              <XAxis 
                dataKey="date" 
                className="text-sm"
                tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                height={50}
              />
              
              <YAxis 
                className="text-sm"
                tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                width={50}
              />
              
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-md p-3 shadow-xl">
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-white/70">Data:</span>
                            <span className="text-sm font-medium text-white">{data.fullDate}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-white/70">Valor:</span>
                            <span className="text-sm font-bold text-white">{data.value} {unit}</span>
                          </div>
                          {data.laboratory && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm text-white/70">Lab:</span>
                              <span className="text-sm text-white">{data.laboratory}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-white/70">Status:</span>
                            <span className={`text-sm font-medium ${
                              data.status === 'alto' || data.status === 'crítico' 
                                ? 'text-yellow-400' 
                                : data.status === 'baixo'
                                ? 'text-yellow-400'
                                : 'text-green-400'
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
              
              {/* Área sombreada da faixa de referência - apenas se houver valores */}
              {referenceMin !== null && referenceMax !== null && (
                <>
                  <ReferenceArea
                    y1={referenceMin}
                    y2={referenceMax}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.1}
                  />
                  <ReferenceLine 
                    y={referenceMax} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                  />
                  <ReferenceLine 
                    y={referenceMin} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                  />
                </>
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
