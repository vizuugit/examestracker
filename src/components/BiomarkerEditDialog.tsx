import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useBiomarkerCorrection } from '@/hooks/useBiomarkerCorrection';

interface BiomarkerEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  biomarker: {
    result_id: string;
    exam_id: string;
    biomarker_name: string;
    value: string;
    value_numeric: number | null;
    unit: string | null;
    reference_min: number | null;
    reference_max: number | null;
    status: 'normal' | 'alto' | 'baixo' | 'crítico';
  };
  onSuccess?: () => void;
}

interface CorrectedData {
  biomarker_name: string;
  value: string;
  value_numeric: string;
  unit: string;
  reference_min: string;
  reference_max: string;
  status: 'normal' | 'alto' | 'baixo' | 'crítico';
}

export function BiomarkerEditDialog({
  open,
  onOpenChange,
  patientId,
  biomarker,
  onSuccess,
}: BiomarkerEditDialogProps) {
  const { submitBiomarkerCorrections, submitting } = useBiomarkerCorrection();

  const [correctedData, setCorrectedData] = useState<CorrectedData>({
    biomarker_name: biomarker.biomarker_name,
    value: biomarker.value,
    value_numeric: biomarker.value_numeric?.toString() || '',
    unit: biomarker.unit || '',
    reference_min: biomarker.reference_min?.toString() || '',
    reference_max: biomarker.reference_max?.toString() || '',
    status: biomarker.status,
  });

  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Reset form when dialog opens or biomarker changes
  useEffect(() => {
    if (open) {
      setCorrectedData({
        biomarker_name: biomarker.biomarker_name,
        value: biomarker.value,
        value_numeric: biomarker.value_numeric?.toString() || '',
        unit: biomarker.unit || '',
        reference_min: biomarker.reference_min?.toString() || '',
        reference_max: biomarker.reference_max?.toString() || '',
        status: biomarker.status,
      });
      setValidationWarning(null);
    }
  }, [open, biomarker]);

  // Validate on change
  useEffect(() => {
    const numValue = parseFloat(correctedData.value_numeric);
    const minRef = parseFloat(correctedData.reference_min);
    const maxRef = parseFloat(correctedData.reference_max);

    if (!isNaN(numValue) && !isNaN(minRef) && !isNaN(maxRef)) {
      if (correctedData.status === 'normal' && (numValue < minRef || numValue > maxRef)) {
        setValidationWarning(
          `⚠️ Valor ${numValue} está fora da referência (${minRef}-${maxRef}), mas status é "normal"`
        );
      } else if (correctedData.status === 'alto' && numValue <= maxRef) {
        setValidationWarning(
          `⚠️ Valor ${numValue} está dentro/abaixo da referência, mas status é "alto"`
        );
      } else if (correctedData.status === 'baixo' && numValue >= minRef) {
        setValidationWarning(
          `⚠️ Valor ${numValue} está dentro/acima da referência, mas status é "baixo"`
        );
      } else {
        setValidationWarning(null);
      }
    } else {
      setValidationWarning(null);
    }
  }, [correctedData]);

  const handleSubmit = async () => {
    const corrections = [];

    // Comparar e coletar mudanças
    if (correctedData.biomarker_name !== biomarker.biomarker_name) {
      corrections.push({
        biomarkerId: biomarker.result_id,
        fieldName: 'biomarker_name',
        aiValue: biomarker.biomarker_name,
        userValue: correctedData.biomarker_name,
      });
    }

    if (correctedData.value !== biomarker.value) {
      corrections.push({
        biomarkerId: biomarker.result_id,
        fieldName: 'biomarker_value',
        aiValue: biomarker.value,
        userValue: correctedData.value,
      });
    }

    if (correctedData.unit !== (biomarker.unit || '')) {
      corrections.push({
        biomarkerId: biomarker.result_id,
        fieldName: 'biomarker_unit',
        aiValue: biomarker.unit,
        userValue: correctedData.unit,
      });
    }

    if (correctedData.reference_min !== (biomarker.reference_min?.toString() || '')) {
      corrections.push({
        biomarkerId: biomarker.result_id,
        fieldName: 'reference_min',
        aiValue: biomarker.reference_min,
        userValue: parseFloat(correctedData.reference_min) || null,
      });
    }

    if (correctedData.reference_max !== (biomarker.reference_max?.toString() || '')) {
      corrections.push({
        biomarkerId: biomarker.result_id,
        fieldName: 'reference_max',
        aiValue: biomarker.reference_max,
        userValue: parseFloat(correctedData.reference_max) || null,
      });
    }

    if (correctedData.status !== biomarker.status) {
      corrections.push({
        biomarkerId: biomarker.result_id,
        fieldName: 'biomarker_status',
        aiValue: biomarker.status,
        userValue: correctedData.status,
      });
    }

    if (corrections.length === 0) {
      onOpenChange(false);
      return;
    }

    try {
      await submitBiomarkerCorrections({
        patientId,
        examId: biomarker.exam_id,
        corrections,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      // Error já tratado no hook
      console.error('Erro ao submeter correções:', error);
    }
  };

  const hasChanges =
    correctedData.biomarker_name !== biomarker.biomarker_name ||
    correctedData.value !== biomarker.value ||
    correctedData.unit !== (biomarker.unit || '') ||
    correctedData.reference_min !== (biomarker.reference_min?.toString() || '') ||
    correctedData.reference_max !== (biomarker.reference_max?.toString() || '') ||
    correctedData.status !== biomarker.status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Biomarcador</DialogTitle>
          <DialogDescription>
            Corrija qualquer erro na extração dos dados do biomarcador. Suas correções ajudam a melhorar a IA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome do Biomarcador */}
          <div className="space-y-2">
            <Label htmlFor="biomarker_name">Nome do Biomarcador</Label>
            <Input
              id="biomarker_name"
              value={correctedData.biomarker_name}
              onChange={(e) =>
                setCorrectedData({ ...correctedData, biomarker_name: e.target.value })
              }
              placeholder="Ex: Colesterol LDL"
            />
            {correctedData.biomarker_name !== biomarker.biomarker_name && (
              <p className="text-xs text-muted-foreground">
                <span className="line-through">Original: {biomarker.biomarker_name}</span>
              </p>
            )}
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="value">Valor (Texto)</Label>
            <Input
              id="value"
              value={correctedData.value}
              onChange={(e) => setCorrectedData({ ...correctedData, value: e.target.value })}
              placeholder="Ex: 150 ou < 0.5 ou Não detectável"
            />
            {correctedData.value !== biomarker.value && (
              <p className="text-xs text-muted-foreground">
                <span className="line-through">Original: {biomarker.value}</span>
              </p>
            )}
          </div>

          {/* Valor Numérico */}
          <div className="space-y-2">
            <Label htmlFor="value_numeric">Valor Numérico (opcional)</Label>
            <Input
              id="value_numeric"
              type="number"
              step="0.01"
              value={correctedData.value_numeric}
              onChange={(e) =>
                setCorrectedData({ ...correctedData, value_numeric: e.target.value })
              }
              placeholder="Ex: 150"
            />
            <p className="text-xs text-muted-foreground">
              Extraído automaticamente quando possível
            </p>
          </div>

          {/* Unidade */}
          <div className="space-y-2">
            <Label htmlFor="unit">Unidade</Label>
            <Input
              id="unit"
              value={correctedData.unit}
              onChange={(e) => setCorrectedData({ ...correctedData, unit: e.target.value })}
              placeholder="Ex: mg/dL, g/dL, U/L"
            />
            {correctedData.unit !== (biomarker.unit || '') && biomarker.unit && (
              <p className="text-xs text-muted-foreground">
                <span className="line-through">Original: {biomarker.unit}</span>
              </p>
            )}
          </div>

          {/* Referência Mínima e Máxima */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference_min">Referência Mínima</Label>
              <Input
                id="reference_min"
                type="number"
                step="0.01"
                value={correctedData.reference_min}
                onChange={(e) =>
                  setCorrectedData({ ...correctedData, reference_min: e.target.value })
                }
                placeholder="Ex: 100"
              />
              {correctedData.reference_min !== (biomarker.reference_min?.toString() || '') &&
                biomarker.reference_min && (
                  <p className="text-xs text-muted-foreground">
                    <span className="line-through">Original: {biomarker.reference_min}</span>
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_max">Referência Máxima</Label>
              <Input
                id="reference_max"
                type="number"
                step="0.01"
                value={correctedData.reference_max}
                onChange={(e) =>
                  setCorrectedData({ ...correctedData, reference_max: e.target.value })
                }
                placeholder="Ex: 200"
              />
              {correctedData.reference_max !== (biomarker.reference_max?.toString() || '') &&
                biomarker.reference_max && (
                  <p className="text-xs text-muted-foreground">
                    <span className="line-through">Original: {biomarker.reference_max}</span>
                  </p>
                )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={correctedData.status}
              onValueChange={(value: 'normal' | 'alto' | 'baixo' | 'crítico') =>
                setCorrectedData({ ...correctedData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
                <SelectItem value="baixo">Baixo</SelectItem>
                <SelectItem value="crítico">Crítico</SelectItem>
              </SelectContent>
            </Select>
            {correctedData.status !== biomarker.status && (
              <p className="text-xs text-muted-foreground">
                <span className="line-through">Original: {biomarker.status}</span>
              </p>
            )}
          </div>

          {/* Warning de Validação */}
          {validationWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validationWarning}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!hasChanges || submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Correções'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
