import { Upload, Users, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

interface QuickActionsProps {
  onUploadClick?: () => void;
}

export const QuickActions = ({ onUploadClick }: QuickActionsProps) => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Upload,
      title: "Upload Tradicional",
      description: "Usar modal completo com mais opções",
      onClick: onUploadClick,
      gradient: "from-rest-blue to-rest-cyan",
    },
    {
      icon: Users,
      title: "Meus Pacientes",
      description: "Ver todos os pacientes cadastrados",
      onClick: () => navigate("/patients"),
      gradient: "from-rest-cyan to-rest-lightblue",
    },
    {
      icon: Plus,
      title: "Novo Paciente",
      description: "Cadastrar um novo paciente",
      onClick: () => navigate("/patients/new"),
      gradient: "from-rest-lightblue to-rest-blue",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Ações Rápidas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <Card
            key={index}
            className="bg-white/5 backdrop-blur-lg border-white/10 cursor-pointer transition-all hover:scale-105 hover:shadow-[0_10px_30px_rgba(0,173,238,0.3)] group"
            onClick={action.onClick}
          >
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {action.title}
              </h3>
              <p className="text-sm text-white/60">{action.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
