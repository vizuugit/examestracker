import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Calendar, Loader2 } from "lucide-react";
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
import { CactoLoader } from "@/components/CactoLoader";
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
  const { uploadMultipleExams, uploading } = useExamUpload();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadQueue, setUploadQueue] = useState<any[]>([]);
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
    fileId?: string;
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
    if (acceptedFiles.length === 0) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/heic",
      "image/heif",
    ];

    // Validar cada arquivo
    const validFiles = acceptedFiles.filter(file => {
      const fileExtension = file.name.toLowerCase().split(".").pop() || "";
      const isAllowedExtension = ["pdf", "jpg", "jpeg", "png", "heic", "heif"].includes(fileExtension);
      
      if (!allowedTypes.includes(file.type) && !isAllowedExtension) {
        toast({
          variant: "destructive",
          title: `Formato não suportado: ${file.name}`,
          description: "Use apenas PDF, JPG, PNG ou HEIC",
        });
        return false;
      }

      if (file.size > 20 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: `Arquivo muito grande: ${file.name}`,
          description: "Máximo de 20MB por arquivo",
        });
        return false;
      }

      return true;
    });

    // Limitar a 10 arquivos
    if (validFiles.length > 10) {
      toast({
        title: "Limite de arquivos excedido",
        description: "Você pode processar até 10 exames por vez. Selecionando apenas os primeiros 10.",
      });
      setFiles(validFiles.slice(0, 10));
    } else {
      setFiles(validFiles);
    }

    // Avisar sobre HEIC
    const hasHEIC = validFiles.some(f => {
      const ext = f.name.toLowerCase().split(".").pop() || "";
      return ext === "heic" || ext === "heif";
    });
    if (hasHEIC) {
      toast({
        title: "Arquivo(s) HEIC detectado(s)",
        description: "Serão convertidos automaticamente.",
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
    maxFiles: 10,
    maxSize: 20 * 1024 * 1024,
    disabled: uploading,
  });

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setFiles([]);
    setUploadQueue([]);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Selecione pelo menos um arquivo",
      });
      return;
    }

    if (!autoMatching && !selectedPatient) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Selecione um paciente",
      });
      return;
    }

    try {
      await uploadMultipleExams({
        files,
        patientId: autoMatching ? undefined : selectedPatient,
        examDate: examDate ? new Date(examDate) : undefined,
        onProgressUpdate: (queue) => {
          setUploadQueue([...queue]);
        },
        onMatchRequired: (name, candidates, examId, fileId) => {
          setMatchData({ extractedName: name, candidates, examId, fileId });
          setMatchDialogOpen(true);
        },
        onComplete: () => {
          toast({
            title: "Upload concluído!",
            description: `${files.length} exame(s) processado(s) com sucesso`,
          });
          setFiles([]);
          setUploadQueue([]);
          setSelectedPatient("");
          setSelectedPatientName("");
          setExamDate(new Date().toISOString().split("T")[0]);
        },
      });
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
      setFiles([]);
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

      {files.length === 0 && !uploading && (
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

      {files.length > 0 && !uploading && (
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

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {files.length} arquivo{files.length > 1 ? 's' : ''} selecionado{files.length > 1 ? 's' : ''}
              </h3>
              <Button variant="ghost" onClick={handleClearAll} className="text-white/70 hover:text-white">
                Limpar tudo
              </Button>
            </div>

            <div className="grid gap-3">
              {files.map((file, idx) => {
                const fileExt = file.name.toLowerCase().split(".").pop() || "";
                const isImage = ["jpg", "jpeg", "png"].includes(fileExt);
                const isHEIC = ["heic", "heif"].includes(fileExt);

                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                    {isImage ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-lg border border-white/20"
                      />
                    ) : isHEIC ? (
                      <div className="w-12 h-12 bg-rest-cyan/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-rest-cyan" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-rest-blue/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-rest-lightblue" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{file.name}</p>
                      <p className="text-xs text-white/60">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => handleRemoveFile(idx)} className="text-white/70 hover:text-white">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
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
                Data do Processamento
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
              Processar {files.length} Exame{files.length > 1 ? 's' : ''}
            </Button>
            <Button
              onClick={handleClearAll}
              variant="outline"
              className="bg-zinc-900/50 backdrop-blur-sm border-zinc-800 text-white hover:bg-zinc-800/50 hover:text-white transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {uploading && uploadQueue.length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8 space-y-4">
          <div className="flex flex-col items-center mb-6">
            <CactoLoader size="md" text="Enviando e processando exames..." />
          </div>
          
          <h3 className="text-lg font-bold text-white text-center">
            Processando {uploadQueue.length} exame{uploadQueue.length > 1 ? 's' : ''}...
          </h3>

          {uploadQueue.map((item) => (
            <div key={item.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                {item.status === 'pending' && (
                  <div className="w-5 h-5 rounded-full border-2 border-white/40" />
                )}
                {item.status === 'uploading' && (
                  <Loader2 className="w-5 h-5 animate-spin text-rest-cyan" />
                )}
                {item.status === 'processing' && (
                  <Loader2 className="w-5 h-5 animate-spin text-rest-lightblue" />
                )}
                {item.status === 'completed' && (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {item.status === 'error' && (
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </div>
                )}
                
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{item.file.name}</p>
                  <p className="text-xs text-white/60">{item.statusMessage}</p>
                  {item.error && <p className="text-xs text-red-400 mt-1">{item.error}</p>}
                </div>
              </div>

              {(item.status === 'uploading' || item.status === 'processing') && (
                <Progress value={item.progress} className="h-1" />
              )}
            </div>
          ))}
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
