import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddBiomarkerDialogProps {
  category: string;
  categoryDisplayName: string;
  onAdd: (biomarkerName: string) => void;
}

export function AddBiomarkerDialog({ category, categoryDisplayName, onAdd }: AddBiomarkerDialogProps) {
  const [open, setOpen] = useState(false);
  const [biomarkerName, setBiomarkerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (biomarkerName.trim()) {
      onAdd(biomarkerName.trim());
      setBiomarkerName('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-2">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Biomarcador
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Biomarcador</DialogTitle>
            <DialogDescription>
              Adicionar um novo biomarcador à categoria {categoryDisplayName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="biomarker-name">Nome do Biomarcador</Label>
              <Input
                id="biomarker-name"
                value={biomarkerName}
                onChange={(e) => setBiomarkerName(e.target.value)}
                placeholder="Ex: Hemoglobina Glicada"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!biomarkerName.trim()}>
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
