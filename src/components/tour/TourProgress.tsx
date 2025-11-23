import { CheckCircle2, Circle } from "lucide-react";

interface TourProgressProps {
  currentStep: number;
  totalSteps: number;
  onStepClick: (step: number) => void;
}

export const TourProgress = ({ currentStep, totalSteps, onStepClick }: TourProgressProps) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i);

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 backdrop-blur-lg border border-white/10 rounded-full px-6 py-3 shadow-2xl">
      <div className="flex items-center gap-4">
        <span className="text-white/70 text-sm font-medium">
          Etapa {currentStep + 1} de {totalSteps}
        </span>
        <div className="flex items-center gap-2">
          {steps.map((step) => (
            <button
              key={step}
              onClick={() => onStepClick(step)}
              className={`transition-all duration-300 ${
                step < currentStep
                  ? "text-green-400"
                  : step === currentStep
                  ? "text-rest-lightblue scale-125"
                  : "text-white/30"
              }`}
              aria-label={`Ir para etapa ${step + 1}`}
            >
              {step < currentStep ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>
          ))}
        </div>
        <div className="w-32 bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-rest-blue to-rest-cyan h-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
