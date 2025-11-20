import { Card } from '@/components/ui/card';

interface CategoryStatsProps {
  totalCategories: number;
  totalBiomarkers: number;
  totalOverrides: number;
  coverage: number;
}

export function CategoryStats({ totalCategories, totalBiomarkers, totalOverrides, coverage }: CategoryStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="p-4">
        <div className="text-2xl font-bold text-primary">{totalCategories}</div>
        <div className="text-sm text-muted-foreground">Categorias</div>
      </Card>
      
      <Card className="p-4">
        <div className="text-2xl font-bold text-primary">{totalBiomarkers}</div>
        <div className="text-sm text-muted-foreground">Biomarcadores</div>
      </Card>
      
      <Card className="p-4">
        <div className="text-2xl font-bold text-primary">{totalOverrides}</div>
        <div className="text-sm text-muted-foreground">Personalizações</div>
      </Card>
      
      <Card className="p-4">
        <div className="text-2xl font-bold text-primary">{coverage}%</div>
        <div className="text-sm text-muted-foreground">Cobertura</div>
      </Card>
    </div>
  );
}
