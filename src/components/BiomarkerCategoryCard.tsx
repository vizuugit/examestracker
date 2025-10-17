import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { CategoryKey, getCategoryColor } from '@/utils/biomarkerCategories';

interface BiomarkerCategoryCardProps {
  category: CategoryKey;
  categoryName: string;
  totalBiomarkers: number;
  normalCount: number;
  alteredCount: number;
  onClick: () => void;
}

export function BiomarkerCategoryCard({
  category,
  categoryName,
  totalBiomarkers,
  normalCount,
  alteredCount,
  onClick
}: BiomarkerCategoryCardProps) {
  const categoryColor = getCategoryColor(category);

  return (
    <Card 
      className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: categoryColor }}
            />
            {categoryName}
          </CardTitle>
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-muted-foreground">
              {normalCount} normal{normalCount !== 1 ? 'is' : ''}
            </span>
          </div>
          
          {alteredCount > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-muted-foreground">
                {alteredCount} alterado{alteredCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-3">
          <Badge variant="secondary" className="text-xs">
            {totalBiomarkers} biomarcador{totalBiomarkers !== 1 ? 'es' : ''}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
