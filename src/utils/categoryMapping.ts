/**
 * Mapeamento das 25 categorias originais do biomarker-specification.json
 * para as 11 categorias simplificadas do sistema
 */
export const JSON_TO_SIMPLIFIED_CATEGORY: Record<string, string> = {
  // Metabólico - Glicemia, Lipídeos, Risco Cardiovascular
  "AVALIAÇÃO DO PERFIL GLICÊMICO E INSULINÊMICO": "metabolico",
  "PERFIL LIPÍDICO": "metabolico",
  "CONCENTRAÇÃO DE PARTÍCULAS LDL": "metabolico",
  "TAMANHO DO PICO DE LDL": "metabolico",
  
  // Marcadores Inflamatórios - Fatores de Risco
  "FATORES DE RISCO CARDIOVASCULAR": "marcadores_inflamatorios",
  
  // Renal
  "FUNÇÃO RENAL": "renal",
  "EXAMES DE URINA": "renal",
  
  // Hepático
  "FUNÇÃO HEPÁTICA": "hepatico",
  "TGP /ALT  - H<58 M<41": "hepatico",
  
  // Íons
  "IONOGRAMA E BIOQUÍMICA DO CÁLCIO": "ions",
  
  // Hormonal
  "FUNÇÃO TIREOIDEANA": "hormonal",
  "HORMÔNIOS SEXUAIS E OUTROS HORMÔNIOS": "hormonal",
  "CORTISOL SALIVAR ACORDAR": "hormonal",
  "CORTISOL POS DEXA VR<1,8": "hormonal",
  
  // Vitaminas e Minerais
  "METAIS PESADOS": "vitaminas_minerais",
  
  // Hematológico
  "ELETROFORESE DE PROTEINAS PLASMÁTICAS": "hematologico",
  "BETA 2 MICROGLOBULINA:": "hematologico",
  
  // Marcadores Inflamatórios
  "ANTICORPOS ANTI MITOCÔNDRIA": "marcadores_inflamatorios",
  "KD ABC SCORE PROT C REAT": "marcadores_inflamatorios",
  
  // Outros - Exames mais complexos ou não laboratoriais
  "MARCADORES TUMORAIS E OUTROS": "outros",
  "KD ABC SCORE ALBUMINA": "outros",
  "DENSITOMETRIA ÓSSEA": "outros",
  "EXAMES DE IMAGEM": "outros",
  "CINTILOGRAFIA MIOCARDICA": "outros",
  "ULTRASSOM ENDOVAGINAL": "outros"
};

/**
 * Categorias simplificadas do sistema (11 categorias)
 */
export const SIMPLIFIED_CATEGORIES = [
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
] as const;

export type SimplifiedCategory = typeof SIMPLIFIED_CATEGORIES[number];

/**
 * Nomes amigáveis com emojis para exibição na UI
 */
export const CATEGORY_DISPLAY_NAMES: Record<SimplifiedCategory, string> = {
  'hematologico': '🩸 Hematológico',
  'metabolico': '⚡ Metabólico',
  'hepatico': '🫀 Hepático',
  'renal': '🫘 Renal',
  'ions': '⚗️ Íons',
  'hormonal': '🧬 Hormonal',
  'vitaminas_minerais': '💊 Vitaminas e Minerais',
  'marcadores_inflamatorios': '🔥 Marcadores Inflamatórios',
  'marcadores_musculares': '💪 Marcadores Musculares',
  'marcadores_prostaticos': '🔬 Marcadores Prostáticos',
  'outros': '📋 Outros'
};

/**
 * Mapeia uma categoria do JSON para a categoria simplificada
 * @param jsonCategory - Categoria original do biomarker-specification.json
 * @returns Categoria simplificada do sistema
 */
export function mapJsonCategoryToSimplified(jsonCategory: string): SimplifiedCategory {
  const mapped = JSON_TO_SIMPLIFIED_CATEGORY[jsonCategory];
  return (mapped as SimplifiedCategory) || 'outros';
}

/**
 * Retorna o índice de ordenação de uma categoria simplificada
 */
export function getCategoryOrder(category: string): number {
  const index = SIMPLIFIED_CATEGORIES.indexOf(category as SimplifiedCategory);
  return index !== -1 ? index : 999;
}
