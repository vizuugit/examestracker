import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Calendar, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamUploadDialog } from "@/components/ExamUploadDialog";
import { ExamResultsDialog } from "@/components/ExamResultsDialog";
import { toast } from "sonner";

const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .eq("professional_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const { data: exams } = useQuery({
    queryKey: ["patient-exams", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("patient_id", id)
        .order("exam_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // FASE 4: Realtime listener para atualizar exames automaticamente
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel('exam-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'exams',
          filter: `patient_id=eq.${id}`,
        },
        (payload) => {
          console.log('[Realtime] Exame atualizado:', payload);
          
          // Invalidar cache para atualizar a lista
          queryClient.invalidateQueries({ queryKey: ['patient-exams', id] });

          // Mostrar toast quando exame for completado
          if (payload.new.processing_status === 'completed') {
            toast.success('Exame processado com sucesso!', {
              description: `${payload.new.total_biomarkers || 0} biomarcadores extraídos.`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-zinc-900 to-black">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20">
          <Skeleton className="h-96 bg-white/10" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-zinc-900 to-black">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Paciente não encontrado</h2>
            <Button onClick={() => navigate("/patients")} className="mt-4">
              Voltar para pacientes
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-zinc-900 to-black">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <Button
            variant="ghost"
            onClick={() => navigate("/patients")}
            className="mb-6 text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {/* Patient Info */}
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-rest-blue to-rest-cyan rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {patient.full_name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {patient.full_name}
                  </h1>
                  <div className="flex gap-4 text-white/70">
                    {patient.date_of_birth && (
                      <span>
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {new Date(patient.date_of_birth).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    {patient.cpf && <span>CPF: {patient.cpf}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate(`/patients/${id}/dashboard`)}
                  variant="outline"
                  className="border-rest-blue text-rest-blue hover:bg-rest-blue/10"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Ver Dashboard
                </Button>
                <Button
                  onClick={() => setUploadDialogOpen(true)}
                  className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload de Exame
                </Button>
              </div>
            </div>

            {patient.medical_conditions && patient.medical_conditions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {patient.medical_conditions.map((condition, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-rest-blue/20 text-rest-lightblue rounded-full text-sm"
                  >
                    {condition}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-rest-lightblue" />
                <span className="text-white/70">Total de Exames</span>
              </div>
              <p className="text-3xl font-bold text-white">{exams?.length || 0}</p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-rest-lightblue" />
                <span className="text-white/70">Último Exame</span>
              </div>
              <p className="text-lg font-bold text-white">
                {exams && exams.length > 0
                  ? new Date(exams[0].exam_date || exams[0].upload_date).toLocaleDateString("pt-BR")
                  : "Nenhum"}
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-rest-lightblue" />
                <span className="text-white/70">Status</span>
              </div>
              <p className="text-lg font-bold text-rest-lightblue">Ativo</p>
            </div>
          </div>

          {/* Recent Exams */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Exames Recentes</h2>
            {exams && exams.length > 0 ? (
              <div className="space-y-4">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    onClick={() => exam.processing_status === 'completed' && setSelectedExamId(exam.id)}
                    className={`bg-white/5 rounded-xl p-4 border border-white/10 transition-all ${
                      exam.processing_status === 'completed' 
                        ? 'hover:border-rest-blue/50 cursor-pointer hover:bg-white/10' 
                        : 'hover:border-rest-blue/30'
                    } ${exam.processing_status === 'processing' ? 'animate-pulse' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{exam.laboratory || "Laboratório não informado"}</p>
                        <p className="text-sm text-white/60">
                          {new Date(exam.exam_date || exam.upload_date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            exam.processing_status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : exam.processing_status === "processing"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {exam.processing_status === "completed"
                            ? "Processado"
                            : exam.processing_status === "processing"
                            ? "Processando..."
                            : "Aguardando"}
                        </span>
                        {exam.total_biomarkers && (
                          <span className="text-white/60">{exam.total_biomarkers} biomarcadores</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Upload className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/60">Nenhum exame cadastrado ainda</p>
                <Button
                  onClick={() => setUploadDialogOpen(true)}
                  className="mt-4 bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white"
                >
                  Fazer Upload do Primeiro Exame
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      <ExamUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        patientId={patient.id}
        patientName={patient.full_name}
        onSuccess={() => {
          // Refetch exams
        }}
      />

      <ExamResultsDialog
        open={!!selectedExamId}
        onOpenChange={(open) => !open && setSelectedExamId(null)}
        examId={selectedExamId}
      />
    </div>
  );
};

export default PatientProfile;
