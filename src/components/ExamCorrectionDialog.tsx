import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useExamCorrection } from "@/hooks/useExamCorrection";
import { AlertCircle } from "lucide-react";

interface ExamCorrectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
  currentData: {
    paciente?: string;
    laboratorio?: string;
    data_exame?: string;
    data_nascimento?: string;
  };
  onSuccess?: () => void;
}

export function ExamCorrectionDialog({
  open,
  onOpenChange,
  examId,
  currentData,
  onSuccess,
}: ExamCorrectionDialogProps) {
  const { submitCorrection, submitting } = useExamCorrection();
  
  const [correctedData, setCorrectedData] = useState({
    paciente: currentData.paciente || '',
    laboratorio: currentData.laboratorio || '',
    data_exame: currentData.data_exame || '',
    data_nascimento: currentData.data_nascimento || '',
  });

  const handleSubmit = async () => {
    const corrections = [];

    // Verificar quais campos foram alterados
    if (correctedData.paciente !== currentData.paciente) {
      corrections.push({
        examId,
        fieldName: 'paciente' as const,
        aiValue: currentData.paciente || '',
        userValue: correctedData.paciente,
      });
    }

    if (correctedData.laboratorio !== currentData.laboratorio) {
      corrections.push({
        examId,
        fieldName: 'laboratorio' as const,
        aiValue: currentData.laboratorio || '',
        userValue: correctedData.laboratorio,
      });
    }

    if (correctedData.data_exame !== currentData.data_exame) {
      corrections.push({
        examId,
        fieldName: 'data_exame' as const,
        aiValue: currentData.data_exame || '',
        userValue: correctedData.data_exame,
      });
    }

    if (correctedData.data_nascimento !== currentData.data_nascimento) {
      corrections.push({
        examId,
        fieldName: 'data_nascimento' as const,
        aiValue: currentData.data_nascimento || '',
        userValue: correctedData.data_nascimento,
      });
    }

    if (corrections.length === 0) {
      onOpenChange(false);
      return;
    }

    // Enviar todas as correções
    let allSuccess = true;
    for (const correction of corrections) {
      const success = await submitCorrection(correction);
      if (!success) allSuccess = false;
    }

    if (allSuccess) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Corrigir Dados Extraídos</DialogTitle>
          <DialogDescription>
            <div className="flex items-start gap-2 mt-2 p-3 bg-primary/10 rounded-md">
              <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                Suas correções ajudam a IA a melhorar. Corrija apenas os campos que estão errados.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="paciente">Nome do Paciente</Label>
            <Input
              id="paciente"
              value={correctedData.paciente}
              onChange={(e) => setCorrectedData(prev => ({ ...prev, paciente: e.target.value }))}
              placeholder="Nome completo do paciente"
            />
            {currentData.paciente !== correctedData.paciente && (
              <p className="text-xs text-muted-foreground">
                Original: <span className="line-through">{currentData.paciente}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="laboratorio">Laboratório</Label>
            <Input
              id="laboratorio"
              value={correctedData.laboratorio}
              onChange={(e) => setCorrectedData(prev => ({ ...prev, laboratorio: e.target.value }))}
              placeholder="Nome do laboratório"
            />
            {currentData.laboratorio !== correctedData.laboratorio && (
              <p className="text-xs text-muted-foreground">
                Original: <span className="line-through">{currentData.laboratorio}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_exame">Data do Exame</Label>
            <Input
              id="data_exame"
              type="date"
              value={correctedData.data_exame}
              onChange={(e) => setCorrectedData(prev => ({ ...prev, data_exame: e.target.value }))}
            />
            {currentData.data_exame !== correctedData.data_exame && (
              <p className="text-xs text-muted-foreground">
                Original: <span className="line-through">{currentData.data_exame}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_nascimento">Data de Nascimento</Label>
            <Input
              id="data_nascimento"
              type="date"
              value={correctedData.data_nascimento}
              onChange={(e) => setCorrectedData(prev => ({ ...prev, data_nascimento: e.target.value }))}
            />
            {currentData.data_nascimento !== correctedData.data_nascimento && (
              <p className="text-xs text-muted-foreground">
                Original: <span className="line-through">{currentData.data_nascimento}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Enviando..." : "Salvar Correções"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
