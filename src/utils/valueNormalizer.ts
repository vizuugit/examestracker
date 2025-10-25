/**
 * Normaliza valores hematológicos muito grandes para unidades mais legíveis
 */
export function normalizeHematologicalValue(
  value: string | number,
  biomarkerName: string,
  unit?: string
): { normalizedValue: number; normalizedUnit: string } {
  
  const numValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[.,]/g, match => match === ',' ? '.' : match)) 
    : value;
  
  if (isNaN(numValue)) {
    return {
      normalizedValue: numValue,
      normalizedUnit: unit || ''
    };
  }
  
  // Biomarcadores que usam milhões
  const millionBasedBiomarkers = [
    'hemácias', 'hemacias', 'eritrócitos', 'eritrocitos', 'rbc', 'hemacia', 'hemácia'
  ];
  
  const isMillionBased = millionBasedBiomarkers.some(b => 
    biomarkerName.toLowerCase().includes(b)
  );
  
  if (isMillionBased && numValue > 100) {
    // Valor está em unidades absolutas (ex: 5250000)
    // Converter para milhões
    return {
      normalizedValue: numValue / 1000000,
      normalizedUnit: 'milhões/mm³'
    };
  }
  
  // Biomarcadores que usam milhares
  const thousandBasedBiomarkers = [
    'leucócitos', 'leucocitos', 'wbc',
    'plaquetas', 'plt'
  ];
  
  const isThousandBased = thousandBasedBiomarkers.some(b => 
    biomarkerName.toLowerCase().includes(b)
  );
  
  if (isThousandBased && numValue > 10000) {
    return {
      normalizedValue: numValue / 1000,
      normalizedUnit: 'mil/mm³'
    };
  }
  
  // Retornar valor original se já estiver normalizado
  return {
    normalizedValue: numValue,
    normalizedUnit: unit || ''
  };
}

/**
 * Calcula valores de referência absolutos a partir de porcentagens
 */
export function calculateAbsoluteReference(
  percentReference: number | null, 
  totalLeukocytes: number
): number | null {
  if (!percentReference || !totalLeukocytes) return null;
  return Math.round((percentReference / 100) * totalLeukocytes);
}
