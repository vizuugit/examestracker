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
      className="bg-white border border-gray-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 cursor-pointer transition-all duration-300 rounded-2xl overflow-hidden group"
      onClick={onClick}
    >
      {/* Header colorido */}
      <div 
        className="h-2 bg-gradient-to-r from-medical-purple to-medical-purple/70"
      />
      
      <CardHeader className="pb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="p-3 rounded-xl bg-medical-purple/10 group-hover:bg-medical-purple/20 transition-colors">
          <TrendingUp className="w-6 h-6 text-medical-purple" />
        </div>
        <Badge className="bg-medical-purple/20 text-medical-purple border-medical-purple/30 font-bold text-sm px-3 py-1">
          {totalBiomarkers} {totalBiomarkers !== 1 ? 'exames' : 'exame'}
        </Badge>
      </div>
      <CardTitle className="text-xl font-bold text-gray-900 mt-2">
        {categoryName}
      </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Status Normal */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Normais</span>
            </div>
            <span className="text-lg font-bold text-green-700">{normalCount}</span>
          </div>
          
          {/* Status Alterado */}
          {alteredCount > 0 && (
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-gray-700">Alterados</span>
              </div>
              <span className="text-lg font-bold text-amber-700">{alteredCount}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
