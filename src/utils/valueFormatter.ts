/**
 * Formata valores de biomarcadores para exibição legível
 */
export function formatBiomarkerValue(
  value: number | string | null,
  biomarkerName: string,
  unit?: string
): string {
  if (value === null || value === undefined) return '-';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return String(value);
  
  // Valores muito grandes (não normalizados) - formatar com separadores
  if (numValue > 100000) {
    return numValue.toLocaleString('pt-BR');
  }
  
  // Valores decimais - limitar casas decimais baseado no biomarcador
  const decimalPlaces = getDecimalPlaces(biomarkerName, unit);
  return numValue.toFixed(decimalPlaces);
}

function getDecimalPlaces(biomarkerName: string, unit?: string): number {
  const name = biomarkerName.toLowerCase();
  
  // Hemácias, WBC, Plaquetas: 2 casas (ex: 5.25)
  if (name.includes('hemácia') || name.includes('hemacia') || 
      name.includes('leucócito') || name.includes('leucocito') ||
      name.includes('plaqueta')) {
    return 2;
  }
  
  // Hemoglobina, Hematócrito: 1 casa
  if (name.includes('hemoglobin') || name.includes('hematócrito') || name.includes('hematocrito')) {
    return 1;
  }
  
  // Percentuais: 1 casa
  if (unit === '%') {
    return 1;
  }
  
  // Padrão: 2 casas
  return 2;
}
