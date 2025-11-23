import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface TourTooltipProps {
  title: string;
  description: string;
  example?: string;
}

export const TourTooltip = ({ title, description, example }: TourTooltipProps) => {
  return (
    <Card className="bg-yellow-500/10 border-yellow-500/30 backdrop-blur-sm mb-6 animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-yellow-200 font-semibold text-sm mb-1">{title}</h4>
            <p className="text-yellow-200/90 text-sm mb-2">{description}</p>
            {example && (
              <p className="text-yellow-200/80 text-xs italic">
                {example}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
