import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";

interface SkipTourButtonProps {
  onSkip: () => void;
}

export const SkipTourButton = ({ onSkip }: SkipTourButtonProps) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="ghost"
        className="fixed top-24 right-8 z-50 text-white/60 hover:text-white hover:bg-white/10"
      >
        <X className="w-5 h-5 mr-2" />
        Pular Tour
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Você pode revisitar este tour a qualquer momento através do dashboard.
              Recomendamos concluir o tour para entender melhor todas as funcionalidades.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Continuar Tour
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onSkip}
              className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white"
            >
              Pular e Ir para Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
