import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CategoryStats } from './CategoryStats';
import { CategoryCard } from './CategoryCard';
import { SortableCategoryCard } from './SortableCategoryCard';
import { useCategoryManagement } from '@/hooks/useCategoryManagement';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export function CategoryManagementPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const {
    categories,
    isLoading,
    updateBiomarkerName,
    moveBiomarker,
    reorderBiomarkers,
    reorderCategories,
    addBiomarker,
    removeBiomarker,
    getStats,
    refresh,
  } = useCategoryManagement();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const stats = getStats();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((cat) => cat.name === active.id);
      const newIndex = categories.findIndex((cat) => cat.name === over.id);

      const reordered = arrayMove(categories, oldIndex, newIndex);
      reorderCategories(reordered);
    }
  };

  const filteredCategories = categories.map(category => {
    if (!searchQuery) return category;

    const filteredBiomarkers = category.biomarkers.filter(biomarker =>
      biomarker.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return {
      ...category,
      biomarkers: filteredBiomarkers,
    };
  }).filter(category => category.biomarkers.length > 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">🏷️ Gerenciamento de Categorias</h2>
        <p className="text-muted-foreground">
          Gerencie as categorias e biomarcadores do sistema. As alterações serão aplicadas em todos os dashboards.
        </p>
      </div>

      <CategoryStats
        totalCategories={stats.totalCategories}
        totalBiomarkers={stats.totalBiomarkers}
        totalOverrides={stats.totalOverrides}
        coverage={stats.coverage}
      />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar biomarcador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={refresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {searchQuery ? (
        <div className="space-y-3">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.name}
              name={category.name}
              displayName={category.displayName}
              biomarkers={category.biomarkers}
              onReorder={(biomarkers) => reorderBiomarkers(category.name, biomarkers)}
              onEditBiomarker={(oldName, newName) => updateBiomarkerName(oldName, newName, category.name)}
              onDeleteBiomarker={removeBiomarker}
              onAddBiomarker={(biomarkerName) => addBiomarker(biomarkerName, category.name)}
              defaultOpen={searchQuery.length > 0}
            />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map(c => c.name)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {categories.map((category) => (
                <SortableCategoryCard
                  key={category.name}
                  name={category.name}
                  displayName={category.displayName}
                  biomarkers={category.biomarkers}
                  onReorder={(biomarkers) => reorderBiomarkers(category.name, biomarkers)}
                  onEditBiomarker={(oldName, newName) => updateBiomarkerName(oldName, newName, category.name)}
                  onDeleteBiomarker={removeBiomarker}
                  onAddBiomarker={(biomarkerName) => addBiomarker(biomarkerName, category.name)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {filteredCategories.length === 0 && searchQuery && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum biomarcador encontrado com o termo "{searchQuery}"
        </div>
      )}
    </div>
  );
}
