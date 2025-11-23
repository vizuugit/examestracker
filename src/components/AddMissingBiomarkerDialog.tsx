import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddMissingBiomarker } from '@/hooks/useAddMissingBiomarker';
import { Loader2 } from 'lucide-react';

interface AddMissingBiomarkerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
}

const categories = [
  'HEMATOLOGIA',
  'BIOQUIMICA',
  'LIPIDOGRAMA',
  'HORMONIOS',
  'VITAMINAS',
  'IMUNOLOGIA',
  'URINANALISE',
  'MINERAIS',
  'OUTROS',
];

export function AddMissingBiomarkerDialog({
  open,
  onOpenChange,
  examId,
}: AddMissingBiomarkerDialogProps) {
  const { addMissingBiomarker, submitting } = useAddMissingBiomarker();
  
  const [biomarkerName, setBiomarkerName] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [referenceMin, setReferenceMin] = useState('');
  const [referenceMax, setReferenceMax] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [observation, setObservation] = useState('');

  const handleSubmit = async () => {
    if (!biomarkerName.trim() || !value.trim()) {
      return;
    }

    try {
      await addMissingBiomarker({
        examId,
        biomarkerName: biomarkerName.trim(),
        value: value.trim(),
        valueNumeric: parseFloat(value) || undefined,
        unit: unit.trim() || undefined,
        referenceMin: referenceMin ? parseFloat(referenceMin) : undefined,
        referenceMax: referenceMax ? parseFloat(referenceMax) : undefined,
        suggestedCategory: suggestedCategory || undefined,
        observation: observation.trim() || undefined,
      });

      // Limpar formulário e fechar
      setBiomarkerName('');
      setValue('');
      setUnit('');
      setReferenceMin('');
      setReferenceMax('');
      setSuggestedCategory('');
      setObservation('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao adicionar biomarcador:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Biomarcador Ausente</DialogTitle>
          <DialogDescription>
            Preencha os dados do biomarcador que não foi detectado pelo sistema.
            O administrador será notificado para possível adição ao sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="biomarker-name">
              Nome do Biomarcador <span className="text-destructive">*</span>
            </Label>
            <Input
              id="biomarker-name"
              placeholder="Ex: Vitamina D"
              value={biomarkerName}
              onChange={(e) => setBiomarkerName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">
                Valor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="value"
                placeholder="Ex: 45.2"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unidade</Label>
              <Input
                id="unit"
                placeholder="Ex: ng/mL"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ref-min">Referência Mínima</Label>
              <Input
                id="ref-min"
                type="number"
                step="0.01"
                placeholder="Ex: 30"
                value={referenceMin}
                onChange={(e) => setReferenceMin(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref-max">Referência Máxima</Label>
              <Input
                id="ref-max"
                type="number"
                step="0.01"
                placeholder="Ex: 100"
                value={referenceMax}
                onChange={(e) => setReferenceMax(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria Sugerida</Label>
            <Select value={suggestedCategory} onValueChange={setSuggestedCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observation">Observações</Label>
            <Textarea
              id="observation"
              placeholder="Informações adicionais sobre este biomarcador..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!biomarkerName.trim() || !value.trim() || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Adicionar Biomarcador'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}