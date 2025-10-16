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
  const [file, setFile] = useState<File | null>(null);
  const [examDate, setExamDate] = useState<Date>();
  const { uploadExam, uploading, progress, status } = useExamUpload();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFile = acceptedFiles[0];
    if (pdfFile && pdfFile.type === "application/pdf") {
      setFile(pdfFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  });

  const handleUpload = async () => {
    if (!file) return;

    try {
      await uploadExam({
        patientId,
        file,
        examDate,
      });

      // Reset form
      setFile(null);
      setExamDate(undefined);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
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
          {!file && (
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
                  : "Arraste um PDF aqui ou clique para selecionar"}
              </p>
              <p className="text-sm text-white/60">
                Arquivos PDF até 10MB
              </p>
            </div>
          )}

          {/* File Preview */}
          {file && !uploading && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-rest-blue/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-rest-lightblue" />
                  </div>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-white/60">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
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
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 className="w-5 h-5 animate-spin text-rest-lightblue" />
                  <div className="flex-1">
                    <p className="font-medium">{status}</p>
                    {progress > 50 && (
                      <p className="text-xs text-white/50 mt-1">
                        Aguarde, o processamento pode levar até 3 minutos
                      </p>
                    )}
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-white/60 mt-2">{progress}%</p>
              </div>
            </div>
          )}

          {/* Optional Metadata */}
          {file && !uploading && (
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
                disabled={!file}
                className="flex-1 bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white"
              >
                Processar Exame
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
