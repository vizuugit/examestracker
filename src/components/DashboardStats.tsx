import { FileText, Users, Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardStatsProps {
  stats?: {
    totalExams: number;
    totalPatients: number;
    processingExams: number;
    successRate: string;
  };
}

export const DashboardStats = ({ stats }: DashboardStatsProps) => {
  const metrics = [
    {
      label: "Exames Processados",
      value: stats?.totalExams || 0,
      icon: FileText,
      color: "text-rest-lightblue",
      bgColor: "bg-rest-lightblue/20",
    },
    {
      label: "Pacientes Ativos",
      value: stats?.totalPatients || 0,
      icon: Users,
      color: "text-rest-cyan",
      bgColor: "bg-rest-cyan/20",
    },
    {
      label: "Processando Agora",
      value: stats?.processingExams || 0,
      icon: stats?.processingExams ? Loader2 : FileText,
      color: "text-rest-blue",
      bgColor: "bg-rest-blue/20",
      animate: stats?.processingExams ? "animate-spin" : "",
    },
    {
      label: "Taxa de Sucesso",
      value: stats?.successRate || "100%",
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/20",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Visão Geral</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card
            key={index}
            className="bg-white/5 backdrop-blur-lg border-white/10"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                  <metric.icon className={`w-5 h-5 ${metric.color} ${metric.animate}`} />
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
};
