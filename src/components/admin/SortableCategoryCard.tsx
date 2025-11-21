import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CategoryCard } from './CategoryCard';
import { BiomarkerData } from '@/hooks/useCategoryManagement';

interface SortableCategoryCardProps {
  name: string;
  displayName: string;
  biomarkers: BiomarkerData[];
  onReorder: (biomarkers: BiomarkerData[]) => void;
  onEditBiomarker: (oldName: string, newName: string) => void;
  onDeleteBiomarker: (name: string) => void;
  onAddBiomarker: (biomarkerName: string) => void;
  onChangeBiomarkerCategory?: (biomarkerName: string, newCategory: string) => void;
  defaultOpen?: boolean;
}

export function SortableCategoryCard(props: SortableCategoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'default',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <CategoryCard
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
