import { useState, useEffect } from 'react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronRight, GripVertical } from 'lucide-react';
import { BiomarkerItem } from './BiomarkerItem';
import { AddBiomarkerDialog } from './AddBiomarkerDialog';
import { BiomarkerData } from '@/hooks/useCategoryManagement';
import { Badge } from '@/components/ui/badge';

interface CategoryCardProps {
  name: string;
  displayName: string;
  biomarkers: BiomarkerData[];
  onReorder: (biomarkers: BiomarkerData[]) => void;
  onEditBiomarker: (oldName: string, newName: string) => void;
  onDeleteBiomarker: (name: string) => void;
  onAddBiomarker: (name: string) => void;
  defaultOpen?: boolean;
  dragHandleProps?: any;
}

export function CategoryCard({
  name,
  displayName,
  biomarkers,
  onReorder,
  onEditBiomarker,
  onDeleteBiomarker,
  onAddBiomarker,
  defaultOpen = false,
  dragHandleProps,
}: CategoryCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [localBiomarkers, setLocalBiomarkers] = useState(biomarkers);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localBiomarkers.findIndex((b) => b.name === active.id);
      const newIndex = localBiomarkers.findIndex((b) => b.name === over.id);

      const reordered = arrayMove(localBiomarkers, oldIndex, newIndex);
      setLocalBiomarkers(reordered);
      onReorder(reordered);
    }
  };

  // Update local state when prop changes
  useEffect(() => {
    setLocalBiomarkers(biomarkers);
  }, [biomarkers]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border border-white/10 rounded-lg bg-white/5 backdrop-blur-md">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 transition-all duration-200 hover:scale-[1.02]">
        <div className="flex items-center gap-3">
          {dragHandleProps && (
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <ChevronRight
            className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          />
          <span className="font-medium text-lg text-white">{displayName}</span>
          <Badge variant="secondary">{biomarkers.length} biomarcadores</Badge>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-4 pb-4">
        <div className="space-y-2 mt-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localBiomarkers.map((b) => b.name)}
              strategy={verticalListSortingStrategy}
            >
              {localBiomarkers.map((biomarker) => (
                <BiomarkerItem
                  key={biomarker.name}
                  id={biomarker.name}
                  name={biomarker.name}
                  hasOverride={biomarker.hasOverride}
                  onEdit={(oldName, newName) => onEditBiomarker(oldName, newName)}
                  onDelete={onDeleteBiomarker}
                />
              ))}
            </SortableContext>
          </DndContext>

          <AddBiomarkerDialog
            category={name}
            categoryDisplayName={displayName}
            onAdd={onAddBiomarker}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
