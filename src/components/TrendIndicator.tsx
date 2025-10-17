import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  currentValue: number;
  previousValue: number | null;
  isIncreaseFavorable?: boolean;
  className?: string;
}

export function TrendIndicator({ 
  currentValue, 
  previousValue, 
  isIncreaseFavorable = true,
  className 
}: TrendIndicatorProps) {
  if (previousValue === null || previousValue === 0) {
    return (
      <div className={cn("flex items-center gap-1 text-muted-foreground", className)}>
        <Minus className="w-4 h-4" />
        <span className="text-sm">N/A</span>
      </div>
    );
  }

  const percentChange = ((currentValue - previousValue) / previousValue) * 100;
  const isIncreasing = percentChange > 5;
  const isDecreasing = percentChange < -5;
  const isStable = !isIncreasing && !isDecreasing;

  const isFavorable = isStable || 
    (isIncreasing && isIncreaseFavorable) || 
    (isDecreasing && !isIncreaseFavorable);

  const getColor = () => {
    if (isStable) return 'text-muted-foreground';
    return isFavorable ? 'text-green-500' : 'text-red-500';
  };

  const getIcon = () => {
    if (isIncreasing) return <TrendingUp className="w-4 h-4" />;
    if (isDecreasing) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  return (
    <div className={cn("flex items-center gap-1", getColor(), className)}>
      {getIcon()}
      <span className="text-sm font-medium">
        {isStable ? 'Estável' : `${Math.abs(percentChange).toFixed(1)}%`}
      </span>
    </div>
  );
}
