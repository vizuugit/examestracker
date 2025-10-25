// Tabela de referência para normalização de biomarcadores
// Você pode expandir esta tabela com mais variações conforme necessário
export const BIOMARKER_REFERENCE_TABLE: Record<string, {
  normalizedName: string;
  category?: string;
  unit?: string;
}> = {
  // Hemograma - Série Vermelha
  'hemoglobina': { normalizedName: 'Hemoglobina', category: 'hematologico', unit: 'g/dL' },
  'hemoglobina glicada': { normalizedName: 'Hemoglobina', category: 'hematologico', unit: 'g/dL' },
  'hb': { normalizedName: 'Hemoglobina', category: 'hematologico', unit: 'g/dL' },
  'hgb': { normalizedName: 'Hemoglobina', category: 'hematologico', unit: 'g/dL' },
  
  'hemacias': { normalizedName: 'Hemácias', category: 'hematologico', unit: 'M/µL' },
  'eritrocitos': { normalizedName: 'Hemácias', category: 'hematologico', unit: 'M/µL' },
  'rbc': { normalizedName: 'Hemácias', category: 'hematologico', unit: 'M/µL' },
  
  'hematocrito': { normalizedName: 'Hematócrito', category: 'hematologico', unit: '%' },
  'ht': { normalizedName: 'Hematócrito', category: 'hematologico', unit: '%' },
  'hct': { normalizedName: 'Hematócrito', category: 'hematologico', unit: '%' },
  
  'vcm': { normalizedName: 'VCM', category: 'hematologico', unit: 'fL' },
  'volume corpuscular medio': { normalizedName: 'VCM', category: 'hematologico', unit: 'fL' },
  
  'hcm': { normalizedName: 'HCM', category: 'hematologico', unit: 'pg' },
  'hemoglobina corpuscular media': { normalizedName: 'HCM', category: 'hematologico', unit: 'pg' },
  
  'chcm': { normalizedName: 'CHCM', category: 'hematologico', unit: 'g/dL' },
  'concentracao hemoglobina corpuscular media': { normalizedName: 'CHCM', category: 'hematologico', unit: 'g/dL' },
  
  'rdw': { normalizedName: 'RDW', category: 'hematologico', unit: '%' },
  'rdw-cv': { normalizedName: 'RDW', category: 'hematologico', unit: '%' },
  
  // Hemograma - Leucograma
  'leucocitos': { normalizedName: 'Leucócitos', category: 'hematologico', unit: '/µL' },
  'wbc': { normalizedName: 'Leucócitos', category: 'hematologico', unit: '/µL' },
  
  'neutrofilos': { normalizedName: 'Neutrófilos', category: 'hematologico', unit: '/µL' },
  'neutrofilos segmentados': { normalizedName: 'Neutrófilos', category: 'hematologico', unit: '/µL' },
  
  'linfocitos': { normalizedName: 'Linfócitos', category: 'hematologico', unit: '/µL' },
  
  'monocitos': { normalizedName: 'Monócitos', category: 'hematologico', unit: '/µL' },
  'mono': { normalizedName: 'Monócitos', category: 'hematologico', unit: '/µL' },
  
  'eosinofilos': { normalizedName: 'Eosinófilos', category: 'hematologico', unit: '/µL' },
  'eos': { normalizedName: 'Eosinófilos', category: 'hematologico', unit: '/µL' },
  
  'basofilos': { normalizedName: 'Basófilos', category: 'hematologico', unit: '/µL' },
  'baso': { normalizedName: 'Basófilos', category: 'hematologico', unit: '/µL' },
  
  // Plaquetas
  'plaquetas': { normalizedName: 'Plaquetas', category: 'hematologico', unit: '/µL' },
  'plt': { normalizedName: 'Plaquetas', category: 'hematologico', unit: '/µL' },
  'platelet': { normalizedName: 'Plaquetas', category: 'hematologico', unit: '/µL' },
  
  // Bioquímica
  'glicose': { normalizedName: 'Glicose', category: 'metabolico', unit: 'mg/dL' },
  'glicemia': { normalizedName: 'Glicose', category: 'metabolico', unit: 'mg/dL' },
  
  'colesterol total': { normalizedName: 'Colesterol Total', category: 'lipidico', unit: 'mg/dL' },
  'col total': { normalizedName: 'Colesterol Total', category: 'lipidico', unit: 'mg/dL' },
  
  'hdl': { normalizedName: 'HDL', category: 'lipidico', unit: 'mg/dL' },
  'colesterol hdl': { normalizedName: 'HDL', category: 'lipidico', unit: 'mg/dL' },
  
  'ldl': { normalizedName: 'LDL', category: 'lipidico', unit: 'mg/dL' },
  'colesterol ldl': { normalizedName: 'LDL', category: 'lipidico', unit: 'mg/dL' },
  
  'triglicerides': { normalizedName: 'Triglicérides', category: 'lipidico', unit: 'mg/dL' },
  'triglicerideos': { normalizedName: 'Triglicérides', category: 'lipidico', unit: 'mg/dL' },
  
  'creatinina': { normalizedName: 'Creatinina', category: 'renal', unit: 'mg/dL' },
  
  'ureia': { normalizedName: 'Ureia', category: 'renal', unit: 'mg/dL' },
  
  'tgo': { normalizedName: 'TGO', category: 'hepatico', unit: 'U/L' },
  'ast': { normalizedName: 'TGO', category: 'hepatico', unit: 'U/L' },
  
  'tgp': { normalizedName: 'TGP', category: 'hepatico', unit: 'U/L' },
  'alt': { normalizedName: 'TGP', category: 'hepatico', unit: 'U/L' },
  
  'gama gt': { normalizedName: 'Gama GT', category: 'hepatico', unit: 'U/L' },
  'ggt': { normalizedName: 'Gama GT', category: 'hepatico', unit: 'U/L' },
};

/**
 * Remove acentos e caracteres especiais de uma string
 */
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normaliza um nome de biomarcador usando a tabela de referência
 */
export function normalizeBiomarkerWithTable(biomarkerName: string): {
  normalizedName: string;
  category?: string;
  unit?: string;
} | null {
  if (!biomarkerName) return null;
  
  // Limpa e normaliza o nome para busca
  const searchKey = removeAccents(biomarkerName.toLowerCase().trim());
  
  // Busca direta na tabela
  const match = BIOMARKER_REFERENCE_TABLE[searchKey];
  if (match) {
    return match;
  }
  
  // Busca parcial (se o nome contém alguma chave da tabela)
  for (const [key, value] of Object.entries(BIOMARKER_REFERENCE_TABLE)) {
    if (searchKey.includes(key) || key.includes(searchKey)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Adiciona ou atualiza um biomarcador na tabela de referência
 * Útil para expandir a tabela dinamicamente
 */
export function addBiomarkerToReference(
  variations: string[],
  normalizedName: string,
  category?: string,
  unit?: string
): void {
  variations.forEach(variation => {
    const key = removeAccents(variation.toLowerCase().trim());
    BIOMARKER_REFERENCE_TABLE[key] = {
      normalizedName,
      category,
      unit
    };
  });
}
