import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserPlus } from "lucide-react";

interface PatientCandidate {
  id: string;
  full_name: string;
  similarity: number;
}

interface PatientMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedName: string;
  candidates: PatientCandidate[];
  onSelect: (patientId: string | null) => void;
}

export function PatientMatchDialog({
  open,
  onOpenChange,
  extractedName,
  candidates,
  onSelect,
}: PatientMatchDialogProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");

  const handleConfirm = () => {
    if (selectedOption === "create_new") {
      onSelect(null); // null = criar novo paciente
    } else {
      onSelect(selectedOption); // ID do paciente selecionado
    }
    onOpenChange(false);
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 90) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (similarity >= 80) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white">
            Paciente Encontrado no Exame
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Nome extraído: <span className="text-white font-medium">{extractedName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-zinc-400">
            Encontramos pacientes similares. Selecione o correto ou crie um novo:
          </p>

          <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex items-center space-x-3 p-3 rounded-lg border border-zinc-800 hover:bg-zinc-800/50 transition-colors"
              >
                <RadioGroupItem value={candidate.id} id={candidate.id} />
                <Label
                  htmlFor={candidate.id}
                  className="flex-1 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-zinc-400" />
                    <span className="text-white">{candidate.full_name}</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={getSimilarityColor(candidate.similarity)}
                  >
                    {candidate.similarity.toFixed(0)}% similar
                  </Badge>
                </Label>
              </div>
            ))}

            <div className="flex items-center space-x-3 p-3 rounded-lg border border-zinc-800 hover:bg-zinc-800/50 transition-colors">
              <RadioGroupItem value="create_new" id="create_new" />
              <Label
                htmlFor="create_new"
                className="flex-1 flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="h-4 w-4 text-primary" />
                <span className="text-white">
                  Criar novo paciente: <span className="text-primary">{extractedName}</span>
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedOption}
            className="bg-primary hover:bg-primary/90"
          >
            Confirmar Seleção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
