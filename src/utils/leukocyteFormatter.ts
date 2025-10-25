import { formatBiomarkerValue } from './valueFormatter';

/**
 * Biomarcadores que devem exibir valor absoluto + percentual
 */
const LEUKOCYTE_TYPES = [
  'neutrófilos', 'neutrofilos',
  'linfócitos', 'linfocitos', 
  'monócitos', 'monocitos',
  'eosinófilos', 'eosinofilos',
  'basófilos', 'basofilos'
];

/**
 * Verifica se o biomarcador é um tipo de leucócito
 */
export function isLeukocyteType(biomarkerName: string): boolean {
  const name = biomarkerName.toLowerCase();
  return LEUKOCYTE_TYPES.some(type => name.includes(type));
}

/**
 * Combina valores absolutos e percentuais no formato: "4903 (63.1%)"
 */
export function combineLeukocyteValues(
  absoluteValue: number | string | null,
  percentValue: number | string | null,
  biomarkerName: string
): string {
  if (!absoluteValue) return formatBiomarkerValue(percentValue, biomarkerName, '%');
  if (!percentValue) return formatBiomarkerValue(absoluteValue, biomarkerName, '/mm³');
  
  const absFormatted = formatBiomarkerValue(absoluteValue, biomarkerName, '/mm³');
  const pctFormatted = formatBiomarkerValue(percentValue, biomarkerName, '%');
  
  return `${absFormatted} (${pctFormatted}%)`;
}

/**
 * Calcula valor absoluto a partir de percentual e contagem total de leucócitos
 */
export function calculateAbsoluteFromPercent(
  percentValue: number,
  totalLeukocytes: number
): number {
  return Math.round((percentValue / 100) * totalLeukocytes);
}
