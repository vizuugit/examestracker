import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Upload, Calendar, Activity, Heart, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ExamUploadDialog } from "@/components/ExamUploadDialog";
import { ExamResultsDialog } from "@/components/ExamResultsDialog";
import { ExamCorrectionDialog } from "@/components/ExamCorrectionDialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import cactoGif from "@/assets/cacto-loading.gif";
import { useDeleteExam } from "@/hooks/useDeleteExam";
import { useDeletePatient } from "@/hooks/useDeletePatient";

const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [examToCorrect, setExamToCorrect] = useState<any>(null);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [showDeletePatientDialog, setShowDeletePatientDialog] = useState(false);
  const queryClient = useQueryClient();
  const { deleteExam, isDeleting } = useDeleteExam();
  const { deletePatient, isDeleting: isDeletingPatient } = useDeletePatient();

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
        .select("*, health_score, risk_category")
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
      <Navbar showBackButton={true} backButtonPath="/patients" />
      <main className="flex-1 container mx-auto px-4 py-4">
        <div className="max-w-6xl mx-auto">

          {/* Patient Info */}
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8 mb-8">
            <div className="flex flex-col gap-6">
              
              {/* Header: Avatar + Nome */}
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-rest-blue to-rest-cyan rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold">
                  {patient.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Nome com truncate para não quebrar */}
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 truncate" title={patient.full_name}>
                    {patient.full_name}
                  </h1>
                  <div className="flex flex-wrap gap-3 md:gap-4 text-sm md:text-base text-white/70">
                    {patient.date_of_birth && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(patient.date_of_birth).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    {patient.cpf && <span>CPF: {patient.cpf}</span>}
                  </div>
                </div>
              </div>

              {/* Botões de Ação - Reorganizados */}
              <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between pt-4 border-t border-white/10">
                
                {/* Grupo 1: Ações Principais */}
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <Button
                    onClick={() => navigate(`/patients/${id}/dashboard`)}
                    className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    onClick={() => navigate(`/patients/${id}/charts`)}
                    className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Gráficos
                  </Button>
                  <Button
                    onClick={() => setUploadDialogOpen(true)}
                    className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>

                {/* Grupo 2: Ação Destrutiva - Separado visualmente */}
                <div className="flex pt-2 sm:pt-0 sm:pl-3 sm:border-l sm:border-white/10">
                  <Button
                    onClick={() => setShowDeletePatientDialog(true)}
                    variant="outline"
                    className="w-full sm:w-auto border-red-500/50 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </div>
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
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-white">{exam.laboratory || "Laboratório não informado"}</p>
                        <p className="text-sm text-white/60">
                          {new Date(exam.exam_date || exam.upload_date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        {exam.health_score && exam.processing_status === 'completed' && (
                          <div className="flex items-center gap-2">
                            <Heart className={`w-4 h-4 ${
                              exam.health_score >= 80 ? 'text-green-500' : 
                              exam.health_score >= 60 ? 'text-yellow-500' : 
                              'text-red-500'
                            }`} />
                            <span className={`font-bold ${
                              exam.health_score >= 80 ? 'text-green-500' : 
                              exam.health_score >= 60 ? 'text-yellow-500' : 
                              'text-red-500'
                            }`}>
                              {exam.health_score}
                            </span>
                          </div>
                        )}
                        
                        {exam.risk_category && exam.processing_status === 'completed' && (
                          <Badge className={
                            exam.risk_category === 'baixo' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            exam.risk_category === 'moderado' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            exam.risk_category === 'alto' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                            'bg-red-500/20 text-red-400 border-red-500/30'
                          }>
                            {exam.risk_category}
                          </Badge>
                        )}

                        {exam.processing_status === "processing" ? (
                          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-full">
                            <img 
                              src={cactoGif} 
                              alt="Processando" 
                              className="w-4 h-4 object-contain"
                            />
                            <span className="text-sm text-yellow-400">Processando...</span>
                          </div>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              exam.processing_status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {exam.processing_status === "completed"
                              ? "Processado"
                              : "Aguardando"}
                          </span>
                        )}
                        {exam.total_biomarkers && (
                          <span className="text-sm text-white/60 whitespace-nowrap">{exam.total_biomarkers} biomarcadores</span>
                        )}
                        {exam.processing_status === 'completed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExamToCorrect({
                                  id: exam.id,
                                  paciente: exam.patient_name_extracted,
                                  laboratorio: exam.laboratory,
                                  data_exame: exam.exam_date,
                                });
                                setCorrectionDialogOpen(true);
                              }}
                              className="border-white/20 hover:bg-white/10"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Corrigir
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExamToDelete(exam.id);
                              }}
                              className="border-red-500/50 hover:bg-red-500/10 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          </>
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
          queryClient.invalidateQueries({ queryKey: ['patient-exams', id] });
        }}
      />

      <ExamCorrectionDialog
        open={correctionDialogOpen}
        onOpenChange={setCorrectionDialogOpen}
        examId={examToCorrect?.id || ''}
        currentData={{
          paciente: examToCorrect?.paciente,
          laboratorio: examToCorrect?.laboratorio,
          data_exame: examToCorrect?.data_exame,
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['patient-exams', id] });
          setCorrectionDialogOpen(false);
        }}
      />

      <ExamResultsDialog
        open={!!selectedExamId}
        onOpenChange={(open) => !open && setSelectedExamId(null)}
        examId={selectedExamId}
      />

      <AlertDialog open={!!examToDelete} onOpenChange={(open) => !open && setExamToDelete(null)}>
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir Exame?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Esta ação não pode ser desfeita. Todos os resultados e análises deste exame serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (examToDelete) {
                  deleteExam(examToDelete);
                  setExamToDelete(null);
                }
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeletePatientDialog} onOpenChange={setShowDeletePatientDialog}>
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir Paciente?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              <span className="text-red-400 font-semibold">⚠️ ATENÇÃO: Esta ação é irreversível!</span>
              <br /><br />
              Ao excluir este paciente:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Todos os {exams?.length || 0} exames serão removidos</li>
                <li>Todos os resultados e análises serão perdidos</li>
                <li>O histórico completo será apagado</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingPatient} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (patient) {
                  deletePatient(patient.id);
                  setShowDeletePatientDialog(false);
                }
              }}
              disabled={isDeletingPatient}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeletingPatient ? "Excluindo..." : "Sim, Excluir Tudo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PatientProfile;
