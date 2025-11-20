// Tabela de referência para normalização de biomarcadores
// Você pode expandir esta tabela com mais variações conforme necessário
export const BIOMARKER_REFERENCE_TABLE: Record<string, {
  normalizedName: string;
  category?: string;
  unit?: string;
}> = {
  // Hemograma - Série Vermelha
  'hemoglobina': { normalizedName: 'Hemoglobina', category: 'hematologico', unit: 'g/dL' },
  'hb': { normalizedName: 'Hemoglobina', category: 'hematologico', unit: 'g/dL' },
  'hgb': { normalizedName: 'Hemoglobina', category: 'hematologico', unit: 'g/dL' },
  
  // Hemoglobina Glicada (HbA1c) - Metabólico
  'hemoglobina glicada': { normalizedName: 'HbA1c', category: 'metabolico', unit: '%' },
  'hba1c': { normalizedName: 'HbA1c', category: 'metabolico', unit: '%' },
  'a1c': { normalizedName: 'HbA1c', category: 'metabolico', unit: '%' },
  
  'hemacias': { normalizedName: 'Hemácias', category: 'hematologico', unit: 'milhões/mm³' },
  'segmentados (absoluto)': { normalizedName: 'Segmentados', category: 'hematologico', unit: '/mm³' },
  'bastonetes (absoluto)': { normalizedName: 'Bastonetes', category: 'hematologico', unit: '/mm³' },
  'eosinófilos (absoluto)': { normalizedName: 'Eosinófilos (Absoluto)', category: 'hematologico', unit: '/mm³' },
  'eosinofilos (absoluto)': { normalizedName: 'Eosinófilos (Absoluto)', category: 'hematologico', unit: '/mm³' },
  'basófilos (absoluto)': { normalizedName: 'Basófilos (Absoluto)', category: 'hematologico', unit: '/mm³' },
  'basofilos (absoluto)': { normalizedName: 'Basófilos (Absoluto)', category: 'hematologico', unit: '/mm³' },
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
  'neutrofilos segmentados': { normalizedName: 'Segmentados', category: 'hematologico', unit: '/µL' },
  'segmentados': { normalizedName: 'Segmentados', category: 'hematologico', unit: '/µL' },
  'neutrofilos bastonetes': { normalizedName: 'Bastonetes', category: 'hematologico', unit: '/µL' },
  'bastonetes': { normalizedName: 'Bastonetes', category: 'hematologico', unit: '/µL' },
  
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
  
  'colesterol total': { normalizedName: 'Colesterol Total', category: 'metabolico', unit: 'mg/dL' },
  'col total': { normalizedName: 'Colesterol Total', category: 'metabolico', unit: 'mg/dL' },
  
  'hdl': { normalizedName: 'HDL', category: 'metabolico', unit: 'mg/dL' },
  'colesterol hdl': { normalizedName: 'HDL', category: 'metabolico', unit: 'mg/dL' },
  
  'ldl': { normalizedName: 'LDL', category: 'metabolico', unit: 'mg/dL' },
  'colesterol ldl': { normalizedName: 'LDL', category: 'metabolico', unit: 'mg/dL' },
  'colesterol ldl (metodo enzimatico)': { normalizedName: 'Colesterol LDL', category: 'metabolico', unit: 'mg/dL' },
  
  'triglicerides': { normalizedName: 'Triglicérides', category: 'metabolico', unit: 'mg/dL' },
  'triglicerideos': { normalizedName: 'Triglicérides', category: 'metabolico', unit: 'mg/dL' },
  
  'apolipoproteina a1': { normalizedName: 'Apolipoproteína A1', category: 'metabolico', unit: 'mg/dL' },
  'apo a1': { normalizedName: 'Apolipoproteína A1', category: 'metabolico', unit: 'mg/dL' },
  
  'apolipoproteina b': { normalizedName: 'Apolipoproteína B', category: 'metabolico', unit: 'mg/dL' },
  'apo b': { normalizedName: 'Apolipoproteína B', category: 'metabolico', unit: 'mg/dL' },
  
  'lipoproteina (a)': { normalizedName: 'Lipoproteína (a)', category: 'metabolico', unit: 'mg/dL' },
  'lp(a)': { normalizedName: 'Lipoproteína (a)', category: 'metabolico', unit: 'mg/dL' },
  
  'insulina basal': { normalizedName: 'Insulina (Basal)', category: 'metabolico', unit: 'µU/mL' },
  'insulina': { normalizedName: 'Insulina (Basal)', category: 'metabolico', unit: 'µU/mL' },
  
  'creatinina': { normalizedName: 'Creatinina', category: 'renal', unit: 'mg/dL' },
  
  'ureia': { normalizedName: 'Ureia', category: 'renal', unit: 'mg/dL' },
  
  'tfg': { normalizedName: 'TFG', category: 'renal', unit: 'mL/min/1.73m²' },
  'taxa de filtracao glomerular': { normalizedName: 'Taxa de Filtração Glomerular (TFG)', category: 'renal', unit: 'mL/min/1.73m²' },
  
  'acido urico': { normalizedName: 'Ácido Úrico', category: 'metabolico', unit: 'mg/dL' },
  
  'tgo': { normalizedName: 'TGO', category: 'hepatico', unit: 'U/L' },
  'ast': { normalizedName: 'TGO', category: 'hepatico', unit: 'U/L' },
  
  'tgp': { normalizedName: 'TGP', category: 'hepatico', unit: 'U/L' },
  'alt': { normalizedName: 'TGP', category: 'hepatico', unit: 'U/L' },
  'transaminase piruva (tgp/alt)': { normalizedName: 'Transaminase Pirúvica (TGP/ALT)', category: 'hepatico', unit: 'U/L' },
  'transaminase piruvica': { normalizedName: 'Transaminase Pirúvica (TGP/ALT)', category: 'hepatico', unit: 'U/L' },
  
  'gama gt': { normalizedName: 'Gama GT', category: 'hepatico', unit: 'U/L' },
  'ggt': { normalizedName: 'Gama GT', category: 'hepatico', unit: 'U/L' },
  'gama glutamil transferase': { normalizedName: 'Gama Glutamil Transferase', category: 'hepatico', unit: 'U/L' },
  
  'fosfatase alcalina': { normalizedName: 'Fosfatase Alcalina', category: 'hepatico', unit: 'U/L' },
  
  'bilirrubina total': { normalizedName: 'Bilirrubina Total', category: 'hepatico', unit: 'mg/dL' },
  'bilirrubina direta': { normalizedName: 'Bilirrubina Direta', category: 'hepatico', unit: 'mg/dL' },
  'bilirrubina indireta': { normalizedName: 'Bilirrubina Indireta', category: 'hepatico', unit: 'mg/dL' },
  
  // Hormônios
  'tsh': { normalizedName: 'TSH', category: 'hormonal', unit: 'µUI/mL' },
  'hormonio tireoestimulante': { normalizedName: 'TSH (Hormônio Tireoestimulante)', category: 'hormonal', unit: 'µUI/mL' },
  
  't3': { normalizedName: 'T3', category: 'hormonal', unit: 'ng/dL' },
  't3 livre': { normalizedName: 'T3 Livre', category: 'hormonal', unit: 'pg/mL' },
  
  't4': { normalizedName: 'T4', category: 'hormonal', unit: 'µg/dL' },
  't4 livre': { normalizedName: 'T4 Livre', category: 'hormonal', unit: 'ng/dL' },
  
  'cortisol': { normalizedName: 'Cortisol', category: 'hormonal', unit: 'µg/dL' },
  
  'testosterona': { normalizedName: 'Testosterona', category: 'hormonal', unit: 'ng/dL' },
  'testosterona total': { normalizedName: 'Testosterona Total', category: 'hormonal', unit: 'ng/dL' },
  'testosterona livre': { normalizedName: 'Testosterona Livre', category: 'hormonal', unit: 'pg/mL' },
  
  'dihidrotestosterona': { normalizedName: 'Dihidrotestosterona', category: 'hormonal', unit: 'ng/dL' },
  'dht': { normalizedName: 'Dihidrotestosterona', category: 'hormonal', unit: 'ng/dL' },
  
  'estradiol': { normalizedName: 'Estradiol', category: 'hormonal', unit: 'pg/mL' },
  
  'progesterona': { normalizedName: 'Progesterona', category: 'hormonal', unit: 'ng/mL' },
  
  'prolactina': { normalizedName: 'Prolactina', category: 'hormonal', unit: 'ng/mL' },
  
  'fsh': { normalizedName: 'FSH', category: 'hormonal', unit: 'mUI/mL' },
  'hormonio foliculo estimulante': { normalizedName: 'FSH (Hormônio Folículo Estimulante)', category: 'hormonal', unit: 'mUI/mL' },
  
  'lh': { normalizedName: 'LH', category: 'hormonal', unit: 'mUI/mL' },
  'hormonio luteinizante': { normalizedName: 'LH (Hormônio Luteinizante)', category: 'hormonal', unit: 'mUI/mL' },
  
  'paratormonio': { normalizedName: 'Paratormônio (PTH)', category: 'hormonal', unit: 'pg/mL' },
  'pth': { normalizedName: 'Paratormônio (PTH)', category: 'hormonal', unit: 'pg/mL' },
  
  'dhea-s': { normalizedName: 'Sulfato de Dehidroepiandrosterona (DHEA-S)', category: 'hormonal', unit: 'µg/dL' },
  'sulfato de dehidroepiandrosterona': { normalizedName: 'Sulfato de Dehidroepiandrosterona (DHEA-S)', category: 'hormonal', unit: 'µg/dL' },
  
  // Vitaminas e Minerais
  'vitamina d': { normalizedName: 'Vitamina D', category: 'vitaminas_minerais', unit: 'ng/mL' },
  'vitamina d (25-oh)': { normalizedName: 'Vitamina D (25-OH)', category: 'vitaminas_minerais', unit: 'ng/mL' },
  '25-hidroxivitamina d': { normalizedName: 'Vitamina D (25-OH)', category: 'vitaminas_minerais', unit: 'ng/mL' },
  '25 hidroxivitamina d': { normalizedName: 'Vitamina D (25-OH)', category: 'vitaminas_minerais', unit: 'ng/mL' },
  
  'vitamina b12': { normalizedName: 'Vitamina B12', category: 'vitaminas_minerais', unit: 'pg/mL' },
  'cobalamina': { normalizedName: 'Vitamina B12', category: 'vitaminas_minerais', unit: 'pg/mL' },
  
  'acido folico': { normalizedName: 'Ácido Fólico', category: 'vitaminas_minerais', unit: 'ng/mL' },
  'folato': { normalizedName: 'Ácido Fólico', category: 'vitaminas_minerais', unit: 'ng/mL' },
  
  'ferro': { normalizedName: 'Ferro', category: 'vitaminas_minerais', unit: 'µg/dL' },
  'ferro serico': { normalizedName: 'Ferro Sérico', category: 'vitaminas_minerais', unit: 'µg/dL' },
  
  'ferritina': { normalizedName: 'Ferritina', category: 'vitaminas_minerais', unit: 'ng/mL' },
  
  'transferrina': { normalizedName: 'Transferrina', category: 'vitaminas_minerais', unit: 'mg/dL' },
  
  'indice de saturacao de transferrina': { normalizedName: 'Índice de Saturação da Transferrina', category: 'vitaminas_minerais', unit: '%' },
  'indice de saturacao da transferrina': { normalizedName: 'Índice de Saturação da Transferrina', category: 'vitaminas_minerais', unit: '%' },
  'saturacao de transferrina': { normalizedName: 'Índice de Saturação da Transferrina', category: 'vitaminas_minerais', unit: '%' },
  'saturacao da transferrina': { normalizedName: 'Índice de Saturação da Transferrina', category: 'vitaminas_minerais', unit: '%' },
  'istf': { normalizedName: 'Índice de Saturação da Transferrina', category: 'vitaminas_minerais', unit: '%' },
  
  'capacidade total de ligacao de ferro': { normalizedName: 'Capacidade Total de Ligação de Ferro', category: 'vitaminas_minerais', unit: 'µg/dL' },
  'tibc': { normalizedName: 'Capacidade Total de Ligação de Ferro', category: 'vitaminas_minerais', unit: 'µg/dL' },
  
  'capacidade latente de ligacao de ferro': { normalizedName: 'Capacidade Latente de Ligação de Ferro', category: 'vitaminas_minerais', unit: 'µg/dL' },
  'uibc': { normalizedName: 'Capacidade Latente de Ligação de Ferro', category: 'vitaminas_minerais', unit: 'µg/dL' },
  
  'calcio': { normalizedName: 'Cálcio', category: 'ions', unit: 'mg/dL' },
  'calcio ionico': { normalizedName: 'Cálcio Iônico', category: 'ions', unit: 'mmol/L' },
  
  'magnesio': { normalizedName: 'Magnésio', category: 'ions', unit: 'mg/dL' },
  
  'fosforo': { normalizedName: 'Fósforo', category: 'ions', unit: 'mg/dL' },
  
  'potassio': { normalizedName: 'Potássio', category: 'ions', unit: 'mEq/L' },
  
  'sodio': { normalizedName: 'Sódio', category: 'ions', unit: 'mEq/L' },
  
  'zinco': { normalizedName: 'Zinco', category: 'vitaminas_minerais', unit: 'µg/dL' },
  
  'cobre': { normalizedName: 'Cobre', category: 'vitaminas_minerais', unit: 'µg/dL' },
  
  'selenio': { normalizedName: 'Selênio', category: 'vitaminas_minerais', unit: 'µg/L' },
  
  'aluminio': { normalizedName: 'Alumínio', category: 'vitaminas_minerais', unit: 'µg/L' },
  
  // Marcadores Inflamatórios
  'pcr': { normalizedName: 'PCR', category: 'marcadores_inflamatorios', unit: 'mg/L' },
  'proteina c reativa': { normalizedName: 'PCR', category: 'marcadores_inflamatorios', unit: 'mg/L' },
  'proteina c reativa (pcr) ultrassensivel': { normalizedName: 'Proteína C Reativa (PCR) Ultrassensível', category: 'marcadores_inflamatorios', unit: 'mg/L' },
  'pcr ultrassensivel': { normalizedName: 'Proteína C Reativa (PCR) Ultrassensível', category: 'marcadores_inflamatorios', unit: 'mg/L' },
  
  'vhs': { normalizedName: 'VHS', category: 'marcadores_inflamatorios', unit: 'mm/h' },
  'vhs 1a hora': { normalizedName: 'VHS 1ª Hora', category: 'marcadores_inflamatorios', unit: 'mm/h' },
  'velocidade de hemossedimentacao': { normalizedName: 'VHS', category: 'marcadores_inflamatorios', unit: 'mm/h' },
  
  'homocisteina': { normalizedName: 'Homocisteína', category: 'marcadores_inflamatorios', unit: 'µmol/L' },
  
  // Marcadores Musculares
  'cpk': { normalizedName: 'CPK', category: 'marcadores_musculares', unit: 'U/L' },
  'cpk - creatina fosfoquinase': { normalizedName: 'CPK - Creatina Fosfoquinase', category: 'marcadores_musculares', unit: 'U/L' },
  'creatina fosfoquinase': { normalizedName: 'CPK - Creatina Fosfoquinase', category: 'marcadores_musculares', unit: 'U/L' },
  'ck': { normalizedName: 'CPK', category: 'marcadores_musculares', unit: 'U/L' },
  
  'ldh': { normalizedName: 'LDH', category: 'marcadores_musculares', unit: 'U/L' },
  'desidrogenase latica': { normalizedName: 'LDH', category: 'marcadores_musculares', unit: 'U/L' },
  
  // Marcadores Prostáticos
  'psa total': { normalizedName: 'PSA Total', category: 'marcadores_prostaticos', unit: 'ng/mL' },
  'psa': { normalizedName: 'PSA Total', category: 'marcadores_prostaticos', unit: 'ng/mL' },
  
  'psa livre': { normalizedName: 'PSA Livre', category: 'marcadores_prostaticos', unit: 'ng/mL' },
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
  
  // Busca parcial mais rigorosa (evitar falsos positivos como "hb" dentro de "SHBG")
  for (const [key, value] of Object.entries(BIOMARKER_REFERENCE_TABLE)) {
    // Apenas buscar se a chave tem mais de 2 caracteres para evitar matches muito curtos
    if (key.length > 2) {
      // Verificar se a chave aparece como palavra isolada ou no início/fim
      const keyPattern = new RegExp(`(^|\\s)${key}(\\s|$)`, 'i');
      if (keyPattern.test(searchKey)) {
        return value;
      }
    }
    // Para chaves curtas (<=2), apenas exact match
    if (key.length <= 2 && searchKey === key) {
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
