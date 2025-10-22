import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useExamUpload } from "@/hooks/useExamUpload";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface ExamUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
}

export function ExamUploadDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  onSuccess,
}: ExamUploadDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadQueue, setUploadQueue] = useState<any[]>([]);
  const [examDate, setExamDate] = useState<Date>();
  const { uploadMultipleExams, uploading } = useExamUpload();
  const queryClient = useQueryClient();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/heic",
      "image/heif"
    ];

    // Validar cada arquivo
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: `Arquivo muito grande: ${file.name}`,
          description: "Máximo de 50MB por arquivo",
        });
        return false;
      }

      const fileExtension = file.name.toLowerCase().split('.').pop() || '';
      const isAllowedExtension = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'heif'].includes(fileExtension);
      
      if (!allowedTypes.includes(file.type) && !isAllowedExtension) {
        toast({
          variant: "destructive",
          title: `Formato não suportado: ${file.name}`,
          description: "Use apenas PDF, JPG, PNG ou HEIC"
        });
        return false;
      }

      return true;
    });

    if (validFiles.length > 10) {
      toast({
        title: "Limite de arquivos",
        description: "Máximo de 10 exames por vez. Selecionando os primeiros 10.",
      });
      setFiles(validFiles.slice(0, 10));
    } else {
      setFiles(validFiles);
    }

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
  }, []);

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
    maxSize: 50 * 1024 * 1024,
    disabled: uploading,
  });

  const handleUpload = async () => {
    if (files.length === 0) return;

    try {
      await uploadMultipleExams({
        files,
        patientId,
        examDate,
        onProgressUpdate: (queue) => {
          setUploadQueue([...queue]);
        },
        onComplete: () => {
          queryClient.invalidateQueries({ queryKey: ['patient-exams', patientId] });
          toast({
            title: "Upload concluído!",
            description: `${files.length} exame(s) processado(s)`,
          });
          setFiles([]);
          setUploadQueue([]);
          setExamDate(undefined);
          onSuccess?.();
          onOpenChange(false);
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setFiles([]);
    setUploadQueue([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Upload de Exame - {patientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dropzone */}
          {files.length === 0 && !uploading && (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
                isDragActive
                  ? "border-rest-blue bg-rest-blue/10"
                  : "border-white/20 hover:border-rest-blue/50 bg-white/5",
                uploading && "opacity-50 cursor-not-allowed"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="w-16 h-16 mx-auto mb-4 text-rest-lightblue" />
              <p className="text-lg font-medium mb-2">
                {isDragActive
                  ? "Solte o arquivo aqui..."
                  : "Arraste um documento ou imagem aqui"}
              </p>
              <p className="text-sm text-white/60">
                PDF, JPG, PNG ou HEIC até 50MB
              </p>
            </div>
          )}

          {/* File Preview */}
          {files.length > 0 && !uploading && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white">
                  {files.length} arquivo{files.length > 1 ? 's' : ''} selecionado{files.length > 1 ? 's' : ''}
                </h3>
                <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-white/70 hover:text-white h-8 text-xs">
                  Limpar tudo
                </Button>
              </div>

              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {files.map((file, idx) => {
                  const fileExt = file.name.toLowerCase().split('.').pop() || '';
                  const isImage = ['jpg', 'jpeg', 'png'].includes(fileExt);
                  const isHEIC = ['heic', 'heif'].includes(fileExt);
                  
                  return (
                    <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center gap-3">
                      {isImage ? (
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="Preview" 
                          className="w-10 h-10 object-cover rounded border border-white/20"
                        />
                      ) : isHEIC ? (
                        <div className="w-10 h-10 bg-rest-cyan/20 rounded flex items-center justify-center">
                          <FileText className="w-5 h-5 text-rest-cyan" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-rest-blue/20 rounded flex items-center justify-center">
                          <FileText className="w-5 h-5 text-rest-lightblue" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-white/60">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && uploadQueue.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">
                Processando {uploadQueue.length} exame{uploadQueue.length > 1 ? 's' : ''}...
              </h3>

              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {uploadQueue.map((item) => (
                  <div key={item.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      {item.status === 'pending' && (
                        <div className="w-4 h-4 rounded-full border-2 border-white/40" />
                      )}
                      {item.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 animate-spin text-rest-cyan" />
                      )}
                      {item.status === 'completed' && (
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {item.status === 'error' && (
                        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                          <X className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.file.name}</p>
                        <p className="text-xs text-white/60">{item.statusMessage}</p>
                        {item.error && <p className="text-xs text-red-400 mt-1">{item.error}</p>}
                      </div>
                    </div>

                    {item.status === 'uploading' && (
                      <Progress value={item.progress} className="h-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Metadata */}
          {files.length > 0 && !uploading && (
            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">
                  Data do Exame (opcional)
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white/5 border-white/20 text-white hover:bg-white/10",
                        !examDate && "text-white/60"
                      )}
                    >
                      {examDate ? (
                        format(examDate, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-zinc-900 border-white/10">
                    <Calendar
                      mode="single"
                      selected={examDate}
                      onSelect={setExamDate}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Actions */}
          {!uploading && (
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={files.length === 0}
                className="flex-1 bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white"
              >
                Processar {files.length} Exame{files.length > 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
