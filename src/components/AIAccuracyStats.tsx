import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useExamCorrection } from "@/hooks/useExamCorrection";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

export function AIAccuracyStats() {
  const { getCorrectionStats, loadingStats } = useExamCorrection();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await getCorrectionStats();
    setStats(data);
  };

  if (loadingStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Precisão da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando estatísticas...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const accuracyColor = 
    stats.accuracy_percentage >= 95 ? 'text-green-500' :
    stats.accuracy_percentage >= 85 ? 'text-yellow-500' :
    'text-red-500';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Precisão da IA
        </CardTitle>
        <CardDescription>
          Estatísticas de extração automática de dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Accuracy principal */}
        <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Taxa de Precisão</p>
            <p className={`text-3xl font-bold ${accuracyColor}`}>
              {stats.accuracy_percentage.toFixed(1)}%
            </p>
          </div>
          <TrendingUp className={`h-8 w-8 ${accuracyColor}`} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Exames Processados</p>
            <p className="text-2xl font-bold">{stats.total_exams_processed}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Correções Feitas</p>
            <p className="text-2xl font-bold">{stats.total_corrections}</p>
          </div>
        </div>

        {/* Tipos de erro */}
        {Object.keys(stats.error_types).length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Tipos de Erro Mais Comuns</p>
            <div className="space-y-1">
              {Object.entries(stats.error_types)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 3)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {type.replace(/_/g, ' ')}
                    </span>
                    <Badge variant="secondary">{String(count)}</Badge>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Status de treinamento */}
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-md">
          {stats.ready_for_training ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <p className="text-xs">
                Dados suficientes para treinar a IA (50+ correções)
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <p className="text-xs">
                {50 - stats.total_corrections} correções para treinar a IA
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
