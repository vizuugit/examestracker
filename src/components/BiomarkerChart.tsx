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
      <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-rest-blue to-rest-cyan text-white">
          <CardTitle className="text-2xl font-bold text-white">{biomarkerName}</CardTitle>
          <CardDescription className="text-blue-100 text-base">
            Evolução ao longo do tempo {unit && `(${unit})`}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="p-4 rounded-full bg-gray-100 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Activity className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600 text-lg">
            Este biomarcador não possui valores numéricos para gráfico
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-rest-blue to-rest-cyan text-white">
        <CardTitle className="text-2xl font-bold text-white">{biomarkerName}</CardTitle>
        <CardDescription className="text-blue-100 text-base">
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
                tick={{ fill: '#4B5563' }}
                height={50}
              />
              
              <YAxis 
                className="text-sm"
                tick={{ fill: '#4B5563' }}
                width={50}
              />
              
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-gray-600 font-medium">Data:</span>
                            <span className="text-sm font-semibold text-gray-900">{data.fullDate}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-gray-600 font-medium">Valor:</span>
                            <span className="text-base font-bold text-medical-purple">{data.value} {unit}</span>
                          </div>
                          {data.laboratory && (
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm text-gray-600 font-medium">Lab:</span>
                              <span className="text-sm text-gray-900">{data.laboratory}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-gray-600 font-medium">Status:</span>
                            <span className={`text-sm font-bold ${
                              data.status === 'alto' || data.status === 'crítico' 
                                ? 'text-amber-600' 
                                : data.status === 'baixo'
                                ? 'text-amber-600'
                                : 'text-green-600'
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
                stroke="hsl(199, 85%, 38%)" 
                strokeWidth={3}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const color = payload.status === 'normal' 
                    ? 'hsl(142, 71%, 45%)' 
                    : 'hsl(38, 92%, 50%)';
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill={color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ 
                  r: 8,
                  stroke: 'white',
                  strokeWidth: 3,
                  fill: 'hsl(199, 85%, 38%)'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
