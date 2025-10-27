import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Heart,
  Lightbulb,
  Shield
} from "lucide-react";
import type { ExamWithInsights } from "@/types/exam-insights";

interface ExamInsightsPanelProps {
  exam: ExamWithInsights;
}

export function ExamInsightsPanel({ exam }: ExamInsightsPanelProps) {
  const { clinical_analysis, alerts, trends, recommendations, health_score, risk_category } = exam;

  if (!clinical_analysis) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Info className="w-8 h-8 mx-auto mb-2" />
          <p>Insights não disponíveis para este exame</p>
        </CardContent>
      </Card>
    );
  }

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'baixo': return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Baixo Risco</Badge>;
      case 'moderado': return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Risco Moderado</Badge>;
      case 'alto': return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">Alto Risco</Badge>;
      case 'crítico': return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Risco Crítico</Badge>;
      default: return null;
    }
  };

  const getAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'crítico': return <AlertCircle className="h-4 w-4" />;
      case 'urgente': return <AlertTriangle className="h-4 w-4" />;
      case 'atenção': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (tipo: string): "default" | "destructive" => {
    return tipo === 'crítico' || tipo === 'urgente' ? 'destructive' : 'default';
  };

  return (
    <div className="space-y-6">
      {/* Score de Saúde Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Score de Saúde Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`text-5xl font-bold ${health_score && health_score >= 80 ? 'text-green-600' : health_score && health_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {health_score || 0}
              </div>
              <div className="text-muted-foreground">
                <div className="text-sm">de 100</div>
                {risk_category && getRiskBadge(risk_category)}
              </div>
            </div>
          </div>
          <Progress value={health_score || 0} className="h-2 mb-2" />
          <p className="text-sm text-muted-foreground mt-4">
            {clinical_analysis.resumo_executivo}
          </p>
        </CardContent>
      </Card>

      {/* Alertas */}
      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              Alertas de Saúde ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, idx) => (
              <Alert key={idx} variant={getAlertVariant(alert.tipo)}>
                {getAlertIcon(alert.tipo)}
                <AlertTitle className="font-semibold">{alert.exame}</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">{alert.mensagem}</p>
                  <p className="text-sm font-medium">
                    💡 Ação sugerida: {alert.acao_sugerida}
                  </p>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Áreas de Atenção */}
      {clinical_analysis.areas_atencao && clinical_analysis.areas_atencao.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Áreas que Requerem Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {clinical_analysis.areas_atencao.map((area, idx) => (
                <Badge key={idx} variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tendências */}
      {trends && (trends.melhorias.length > 0 || trends.pioras.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-rest-blue to-rest-cyan flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-white" />
              </div>
              Tendências vs. Histórico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trends.melhorias.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-600">Melhorias</span>
                </div>
                <ul className="space-y-1 ml-6">
                  {trends.melhorias.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {trends.pioras.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-600">Pioras</span>
                </div>
                <ul className="space-y-1 ml-6">
                  {trends.pioras.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Recomendações ({recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="border-l-2 border-rest-blue/30 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={rec.prioridade === 'urgente' || rec.prioridade === 'alta' ? 'destructive' : 'outline'}>
                    {rec.prioridade}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{rec.categoria}</span>
                </div>
                <p className="text-sm">{rec.descricao}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Correlações Clínicas */}
      {clinical_analysis.correlacoes_importantes && clinical_analysis.correlacoes_importantes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🔗 Correlações Clínicas Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {clinical_analysis.correlacoes_importantes.map((corr, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant={corr.relevancia_clinica === 'alta' ? 'outline' : 'outline'}
                    className={corr.relevancia_clinica === 'alta' ? 'bg-gradient-to-r from-rest-blue to-rest-cyan text-white border-0' : ''}
                  >
                    Relevância {corr.relevancia_clinica}
                  </Badge>
                </div>
                <p className="text-sm font-medium mb-1">
                  {corr.exames_relacionados.join(' + ')}
                </p>
                <p className="text-sm text-muted-foreground">{corr.interpretacao}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          ⚠️ Esta análise é gerada por IA e não substitui avaliação médica profissional. 
          Os insights são informativos e devem ser interpretados por um profissional de saúde qualificado.
        </AlertDescription>
      </Alert>
    </div>
  );
}
