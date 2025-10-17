import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useExamUpload } from "@/hooks/useExamUpload";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { PatientMatchDialog } from "@/components/PatientMatchDialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";

export const DashboardUploadZone = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { uploadExam, uploadExamWithAutoMatching, uploading, progress, status } = useExamUpload();
  const [file, setFile] = useState<File | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");
  const [examDate, setExamDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [open, setOpen] = useState(false);
  const [autoMatching, setAutoMatching] = useState(true);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [matchData, setMatchData] = useState<{
    extractedName: string;
    candidates: any[];
    examId: string;
  } | null>(null);

  // Buscar pacientes do profissional
  const { data: patients = [] } = useQuery({
    queryKey: ["patients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, cpf")
        .eq("professional_id", user?.id || "")
        .order("full_name");

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/heic",
      "image/heif",
    ];

    const fileExtension = uploadedFile.name.toLowerCase().split(".").pop() || "";
    const isAllowedExtension = ["pdf", "jpg", "jpeg", "png", "heic", "heif"].includes(
      fileExtension
    );

    if (allowedTypes.includes(uploadedFile.type) || isAllowedExtension) {
      setFile(uploadedFile);

      if (fileExtension === "heic" || fileExtension === "heif") {
        toast({
          title: "Arquivo HEIC detectado",
          description: "Será convertido automaticamente. O processamento pode levar alguns segundos extras.",
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Formato não suportado",
        description: "Use apenas PDF, JPG, PNG ou HEIC",
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/heic": [".heic"],
      "image/heif": [".heif"],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    disabled: uploading,
  });

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Selecione um arquivo",
      });
      return;
    }

    // Modo manual: requer seleção de paciente
    if (!autoMatching && !selectedPatient) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Selecione um paciente",
      });
      return;
    }

    try {
      if (autoMatching) {
        // Upload com auto-matching
        await uploadExamWithAutoMatching({
          file,
          examDate: examDate ? new Date(examDate) : undefined,
          onComplete: () => {
            setFile(null);
            setExamDate(new Date().toISOString().split("T")[0]);
          },
          onMatchRequired: (extractedName, candidates, examId) => {
            setMatchData({ extractedName, candidates, examId });
            setMatchDialogOpen(true);
          },
        });
      } else {
        // Upload manual
        await uploadExam({
          patientId: selectedPatient,
          file,
          examDate: examDate ? new Date(examDate) : undefined,
          onComplete: () => {
            setFile(null);
            setSelectedPatient("");
            setSelectedPatientName("");
            setExamDate(new Date().toISOString().split("T")[0]);
          },
        });
      }
    } catch (error) {
      console.error("Erro no upload:", error);
    }
  };

  const handleMatchSelection = async (patientId: string | null) => {
    if (!matchData) return;

    try {
      if (patientId === null) {
        // Criar novo paciente
        const { data: newPatient, error: createError } = await supabase
          .from("patients")
          .insert({
            full_name: matchData.extractedName,
            professional_id: user?.id,
          })
          .select()
          .single();

        if (createError) throw createError;

        await supabase
          .from("exams")
          .update({ 
            patient_id: newPatient.id,
            matching_type: 'auto_created',
          })
          .eq("id", matchData.examId);

        toast({
          title: "Novo paciente criado!",
          description: matchData.extractedName,
        });
      } else {
        // Paciente selecionado
        await supabase
          .from("exams")
          .update({ 
            patient_id: patientId,
            matching_type: 'auto_selected',
          })
          .eq("id", matchData.examId);

        toast({
          title: "Paciente vinculado!",
        });
      }

      setMatchData(null);
      setFile(null);
      setExamDate(new Date().toISOString().split("T")[0]);

    } catch (error) {
      console.error("Erro ao vincular paciente:", error);
      toast({
        variant: "destructive",
        title: "Erro ao vincular paciente",
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Processar Novo Exame
        </h1>
        <p className="text-xl text-white/70">
          Arraste ou clique para fazer upload (PDF, JPG, PNG, HEIC)
        </p>
      </div>

      {!file && !uploading && (
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer
            ${
              isDragActive
                ? "border-rest-cyan bg-rest-cyan/10 shadow-[0_0_40px_rgba(0,173,238,0.4)]"
                : "border-white/20 bg-white/5 hover:border-rest-lightblue hover:bg-white/10"
            }`}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-rest-lightblue" />
            <p className="text-lg font-medium text-white mb-2">
              {isDragActive
                ? "Solte o arquivo aqui..."
                : "Arraste um exame aqui ou clique para selecionar"}
            </p>
            <p className="text-sm text-white/60">
              PDF • JPG • PNG • HEIC até 20MB
            </p>
          </div>
        </div>
      )}

      {file && !uploading && (
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8 space-y-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              <Switch
                checked={autoMatching}
                onCheckedChange={setAutoMatching}
                className="data-[state=checked]:bg-primary"
              />
              <div>
                <Label className="text-white font-medium">
                  {autoMatching ? "🤖 Matching Automático" : "👤 Seleção Manual"}
                </Label>
                <p className="text-sm text-white/60">
                  {autoMatching 
                    ? "O sistema identifica o paciente automaticamente"
                    : "Você seleciona manualmente o paciente"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const fileExt = file.name.toLowerCase().split(".").pop() || "";
                const isImage = ["jpg", "jpeg", "png"].includes(fileExt);
                const isHEIC = ["heic", "heif"].includes(fileExt);

                if (isImage) {
                  return (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview do exame"
                      className="w-16 h-16 object-cover rounded-lg border border-white/20"
                    />
                  );
                } else if (isHEIC) {
                  return (
                    <div className="w-16 h-16 bg-rest-cyan/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-8 h-8 text-rest-cyan" />
                    </div>
                  );
                } else {
                  return (
                    <div className="w-16 h-16 bg-rest-blue/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-8 h-8 text-rest-lightblue" />
                    </div>
                  );
                }
              })()}

              <div>
                <p className="font-medium text-white">{file.name}</p>
                <p className="text-sm text-white/60">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                  {file.name.toLowerCase().endsWith(".pdf") && " • PDF"}
                  {file.name.toLowerCase().match(/\.(jpg|jpeg|png)$/i) && " • Imagem"}
                  {file.name.toLowerCase().match(/\.(heic|heif)$/i) && " • HEIC (iPhone)"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-4">
            {!autoMatching && (
              <div>
                <Label htmlFor="patient" className="text-white mb-2">
                  Paciente *
                </Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    {selectedPatientName || "Selecione um paciente..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar paciente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {patients.map((patient) => (
                          <CommandItem
                            key={patient.id}
                            value={patient.full_name}
                            onSelect={() => {
                              setSelectedPatient(patient.id);
                              setSelectedPatientName(patient.full_name);
                              setOpen(false);
                            }}
                          >
                            {patient.full_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              </div>
            )}

            <div>
              <Label htmlFor="exam-date" className="text-white mb-2">
                Data do Exame
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  id="exam-date"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleUpload}
              disabled={!autoMatching && !selectedPatient}
              className="flex-1 bg-gradient-to-r from-rest-blue to-rest-cyan hover:opacity-90"
            >
              Processar Exame
            </Button>
            <Button
              onClick={handleRemoveFile}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-rest-cyan border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-medium text-white">Processando...</p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-white/60">{status}</p>
          </div>
        </div>
      )}

      <PatientMatchDialog
        open={matchDialogOpen}
        onOpenChange={setMatchDialogOpen}
        extractedName={matchData?.extractedName || ""}
        candidates={matchData?.candidates || []}
        onSelect={handleMatchSelection}
      />
    </div>
  );
};
