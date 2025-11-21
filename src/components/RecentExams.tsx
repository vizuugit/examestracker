import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, AlertCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { ExamResultsDialog } from "@/components/ExamResultsDialog";
import cactoGif from "@/assets/cacto-loading.gif";

interface RecentExamsProps {
  exams?: Array<{
    id: string;
    patient_name: string;
    patient_id: string;
    file_name: string;
    exam_date: string;
    processing_status: string;
    created_at: string;
  }>;
}

export const RecentExams = ({ exams = [] }: RecentExamsProps) => {
  const navigate = useNavigate();
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completo
          </Badge>
        );
      case "processing":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-rest-cyan/20 rounded-full border border-rest-cyan/30">
            <img 
              src={cactoGif} 
              alt="Processando" 
              className="w-5 h-5 object-contain"
            />
            <span className="text-sm text-rest-cyan">Processando</span>
          </div>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Erro
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <FileText className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  if (!exams || exams.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Exames Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/60 text-center py-8">
              Nenhum exame processado ainda. Faça o upload do primeiro exame acima!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="bg-white/5 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Exames Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors gap-4"
              >
                <div className="flex-1 space-y-1">
                  <button
                    onClick={() => navigate(`/patients/${exam.patient_id}`)}
                    className="font-medium text-white hover:text-rest-cyan transition-colors text-left"
                  >
                    {exam.patient_name}
                  </button>
                  <p className="text-sm text-white/60">{exam.file_name}</p>
                  <p className="text-xs text-white/40">
                    {exam.exam_date
                      ? format(new Date(exam.exam_date), "dd/MM/yyyy", {
                          locale: ptBR,
                        })
                      : format(new Date(exam.created_at), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(exam.processing_status)}
                  {exam.processing_status === "completed" && (
                    <Button
                      onClick={() => setSelectedExamId(exam.id)}
                      size="sm"
                      className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:opacity-90"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Resultados
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedExamId && (
        <ExamResultsDialog
          examId={selectedExamId}
          open={!!selectedExamId}
          onOpenChange={(open) => !open && setSelectedExamId(null)}
        />
      )}
    </div>
  );
};
