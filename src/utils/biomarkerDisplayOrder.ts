/**
 * Ordem de exibição das categorias de biomarcadores
 */
export const CATEGORY_DISPLAY_ORDER = [
  'hematologico',
  'metabolico',
  'lipidico',
  'hepatico',
  'renal',
  'hormonal',
  'vitaminas_minerais',
  'marcadores_inflamatorios',
  'marcadores_musculares',
  'marcadores_prostaticos',
  'outros'
];

/**
 * Ordem de exibição dos biomarcadores dentro de cada categoria
 */
export const BIOMARKER_DISPLAY_ORDER: Record<string, string[]> = {
  hematologico: [
    'Hemoglobina',
    'Hematócrito',
    'Hemácias',
    'HCM',
    'CHCM',
    'VCM',
    'RDW',
    'Leucócitos',
    'Neutrófilos',
    'Linfócitos',
    'Monócitos',
    'Eosinófilos',
    'Basófilos',
    'Plaquetas'
  ],
  metabolico: [
    'Glicose',
    'Insulina (Basal)',
    'Ácido Úrico'
  ],
  lipidico: [
    'Colesterol Total',
    'HDL',
    'LDL',
    'Triglicérides',
    'Apolipoproteína A1',
    'Apolipoproteína B',
    'Lipoproteína (a)'
  ],
  hepatico: [
    'TGO',
    'TGP',
    'Gama GT',
    'Fosfatase Alcalina',
    'Bilirrubina Total',
    'Bilirrubina Direta',
    'Bilirrubina Indireta'
  ],
  renal: [
    'Creatinina',
    'Ureia',
    'TFG'
  ],
  hormonal: [
    'TSH',
    'T3',
    'T4',
    'T4 Livre',
    'Cortisol',
    'Testosterona',
    'Estradiol',
    'Progesterona'
  ],
  vitaminas_minerais: [
    'Vitamina D',
    'Vitamina B12',
    'Ácido Fólico',
    'Ferro',
    'Ferritina',
    'Cálcio',
    'Magnésio',
    'Potássio',
    'Sódio'
  ],
  marcadores_inflamatorios: [
    'PCR',
    'VHS'
  ],
  marcadores_musculares: [
    'CPK',
    'LDH'
  ],
  marcadores_prostaticos: [
    'PSA Total',
    'PSA Livre'
  ]
};

/**
 * Retorna o índice de ordenação de uma categoria
 */
export function getCategoryOrder(category: string): number {
  const index = CATEGORY_DISPLAY_ORDER.indexOf(category);
  return index !== -1 ? index : 999;
}

/**
 * Retorna o índice de ordenação de um biomarcador dentro de sua categoria
 */
export function getBiomarkerOrder(category: string, biomarkerName: string): number {
  const categoryOrder = BIOMARKER_DISPLAY_ORDER[category];
  if (!categoryOrder) return 999;
  
  const index = categoryOrder.indexOf(biomarkerName);
  return index !== -1 ? index : 999;
}
