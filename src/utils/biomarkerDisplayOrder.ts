/**
 * Ordem de exibição das categorias de biomarcadores
 */
export const CATEGORY_DISPLAY_ORDER = [
  'hematologico',
  'metabolico',
  'hepatico',
  'renal',
  'ions',
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
    'Apolipoproteína A1',
    'Apolipoproteína B',
    'Colesterol LDL',
    'Colesterol Total',
    'Glicose',
    'HDL',
    'Insulina (Basal)',
    'Lipoproteína (a)',
    'Triglicérides',
    'Ácido Úrico'
  ],
  hepatico: [
    'Bilirrubina Direta',
    'Bilirrubina Indireta',
    'Bilirrubina Total',
    'Fosfatase Alcalina',
    'Gama Glutamil Transferase',
    'Gama GT',
    'TGO',
    'TGP',
    'Transaminase Pirúvica (TGP/ALT)'
  ],
  renal: [
    'Creatinina',
    'Taxa de Filtração Glomerular (TFG)',
    'TFG',
    'Ureia'
  ],
  ions: [
    'Sódio',
    'Potássio',
    'Cálcio',
    'Cálcio Iônico',
    'Magnésio',
    'Fósforo'
  ],
  hormonal: [
    'Cortisol',
    'Dihidrotestosterona',
    'Estradiol',
    'FSH (Hormônio Folículo Estimulante)',
    'FSH',
    'LH (Hormônio Luteinizante)',
    'LH',
    'Paratormônio (PTH)',
    'Progesterona',
    'Prolactina',
    'Sulfato de Dehidroepiandrosterona (DHEA-S)',
    'T3',
    'T3 Livre',
    'T4',
    'T4 Livre',
    'Testosterona',
    'Testosterona Livre',
    'Testosterona Total',
    'TSH (Hormônio Tireoestimulante)',
    'TSH'
  ],
  vitaminas_minerais: [
    'Alumínio',
    'Capacidade Latente de Ligação de Ferro',
    'Capacidade Total de Ligação de Ferro',
    'Cobre',
    'Ferritina',
    'Ferro',
    'Ferro Sérico',
    'Selênio',
    'Transferrina',
    'Vitamina B12',
    'Vitamina D',
    'Vitamina D (25-OH)',
    'Zinco',
    'Ácido Fólico',
    'Índice de Saturação de Transferrina'
  ],
  marcadores_inflamatorios: [
    'Homocisteína',
    'PCR',
    'Proteína C Reativa (PCR) Ultrassensível',
    'VHS',
    'VHS 1ª Hora'
  ],
  marcadores_musculares: [
    'CPK',
    'CPK - Creatina Fosfoquinase',
    'LDH'
  ],
  marcadores_prostaticos: [
    'PSA Livre',
    'PSA Total'
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
