import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface TourTooltipProps {
  title: string;
  description: string;
  example?: string;
}

export const TourTooltip = ({ title, description, example }: TourTooltipProps) => {
  return (
    <Card className="bg-gradient-to-br from-amber-600 to-orange-600 border-amber-400 backdrop-blur-sm mb-6 animate-fade-in shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-white font-semibold text-sm mb-1">{title}</h4>
            <p className="text-white/95 text-sm mb-2">{description}</p>
            {example && (
              <p className="text-white/90 text-xs italic">
                {example}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
