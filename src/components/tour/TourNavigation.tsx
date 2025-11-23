import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

interface TourNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
}

export const TourNavigation = ({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onComplete,
}: TourNavigationProps) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-4">
      <Button
        onClick={onPrevious}
        disabled={isFirstStep}
        variant="outline"
        className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-lg"
      >
        <ChevronLeft className="w-5 h-5 mr-2" />
        Anterior
      </Button>

      {isLastStep ? (
        <Button
          onClick={onComplete}
          className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white font-semibold px-8 py-6 text-lg shadow-2xl shadow-rest-blue/50"
        >
          Concluir Tour e Ir para Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      ) : (
        <Button
          onClick={onNext}
          className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white font-semibold px-8"
        >
          Próximo
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      )}
    </div>
  );
};
