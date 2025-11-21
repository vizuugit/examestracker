import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useExamCorrection } from "@/hooks/useExamCorrection";
import { Brain, TrendingUp, FileCheck, AlertTriangle } from "lucide-react";

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

  if (loadingStats || !stats) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">--</p>
            <p className="text-sm text-white/60">Precisão da IA</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const accuracyColor = 
    stats.accuracy_percentage >= 95 ? 'text-green-400' :
    stats.accuracy_percentage >= 85 ? 'text-yellow-400' :
    'text-red-400';

  const accuracyBgColor = 
    stats.accuracy_percentage >= 95 ? 'bg-green-400/20' :
    stats.accuracy_percentage >= 85 ? 'bg-yellow-400/20' :
    'bg-red-400/20';

  const metrics = [
    {
      label: "Precisão da IA",
      value: `${stats.accuracy_percentage.toFixed(1)}%`,
      icon: Brain,
      color: accuracyColor,
      bgColor: accuracyBgColor,
    },
    {
      label: "Exames Processados",
      value: stats.total_exams_processed,
      icon: FileCheck,
      color: "text-rest-cyan",
      bgColor: "bg-rest-cyan/20",
    },
    {
      label: "Correções Feitas",
      value: stats.total_corrections,
      icon: TrendingUp,
      color: "text-rest-lightblue",
      bgColor: "bg-rest-lightblue/20",
    },
    {
      label: stats.ready_for_training ? "IA Treinável" : `${50 - stats.total_corrections} para treino`,
      value: stats.ready_for_training ? "✓" : "⏳",
      icon: stats.ready_for_training ? Brain : AlertTriangle,
      color: stats.ready_for_training ? "text-green-400" : "text-yellow-400",
      bgColor: stats.ready_for_training ? "bg-green-400/20" : "bg-yellow-400/20",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Estatísticas da IA</h3>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <Card
            key={index}
            className="bg-white/5 backdrop-blur-lg border-white/10"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {metric.value}
              </p>
              <p className="text-sm text-white/60">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
