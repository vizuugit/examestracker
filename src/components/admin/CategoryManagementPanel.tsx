import { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertCircle, X, Save, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
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
    hasUnsavedChanges,
    saveAllChanges,
    discardChanges
  } = useCategoryManagement();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
    // Filtrar por categoria selecionada
    if (categoryFilter !== 'all' && category.name !== categoryFilter) {
      return { ...category, biomarkers: [] };
    }

    // Filtrar por termo de busca
    if (!searchQuery) return category;

    const filteredBiomarkers = category.biomarkers.filter(biomarker =>
      biomarker.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return {
      ...category,
      biomarkers: filteredBiomarkers,
    };
  }).filter(category => category.biomarkers.length > 0);

  const totalFilteredBiomarkers = filteredCategories.reduce(
    (sum, cat) => sum + cat.biomarkers.length, 
    0
  );

  const hasActiveFilters = searchQuery || categoryFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
  };

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

      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar biomarcador pelo nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  {category.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          )}

          <Button variant="outline" size="icon" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">
              {totalFilteredBiomarkers} biomarcador{totalFilteredBiomarkers !== 1 ? 'es' : ''} encontrado{totalFilteredBiomarkers !== 1 ? 's' : ''}
            </Badge>
            {categoryFilter !== 'all' && (
              <Badge variant="outline">
                Categoria: {categories.find(c => c.name === categoryFilter)?.displayName}
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="outline">
                Busca: "{searchQuery}"
              </Badge>
            )}
          </div>
        )}
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
              onChangeBiomarkerCategory={moveBiomarker}
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
                  onChangeBiomarkerCategory={moveBiomarker}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {filteredCategories.length === 0 && hasActiveFilters && (
        <div className="text-center py-12 space-y-3">
          <div className="text-muted-foreground">
            Nenhum biomarcador encontrado com os filtros aplicados
          </div>
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
      )}

      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Alterações não salvas</p>
                <p className="text-xs text-muted-foreground">
                  Você tem alterações pendentes que ainda não foram salvas
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={discardChanges}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Descartar
              </Button>
              
              <Button 
                onClick={saveAllChanges}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-4 w-4" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
