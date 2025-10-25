export const BIOMARKER_CATEGORIES = {
  cardiovascular: {
    name: 'Cardiovascular',
    biomarkers: [
      'Colesterol Total',
      'Colesterol LDL',
      'Colesterol HDL',
      'Colesterol VLDL',
      'Triglicérides',
      'Proteína C Reativa',
      'Apolipoproteína A',
      'Apolipoproteína B'
    ]
  },
  metabolico: {
    name: 'Metabólico',
    biomarkers: [
      'Glicose',
      'Hemoglobina Glicada',
      'Insulina',
      'Peptídeo C'
    ]
  },
  hematologico: {
    name: 'Hemograma',
    biomarkers: [
      'Hemácias',
      'Hemoglobina',
      'Hematócrito',
      'Leucócitos',
      'Plaquetas',
      'VCM',
      'HCM',
      'CHCM',
      'RDW',
      'Neutrófilos',
      'Linfócitos',
      'Monócitos',
      'Eosinófilos',
      'Basófilos',
      'Eritrograma',
      'Serie Vermelha',
      'Serie Branca',
      'Leucograma'
    ]
  },
  hormonal: {
    name: 'Hormonal',
    biomarkers: [
      'TSH',
      'T4 Livre',
      'T3',
      'Paratormônio',
      'Cortisol',
      'Testosterona'
    ]
  },
  renal: {
    name: 'Renal',
    biomarkers: [
      'Creatinina',
      'Ureia',
      'Ácido Úrico',
      'Clearance de Creatinina'
    ]
  },
  hepatico: {
    name: 'Hepático',
    biomarkers: [
      'TGO',
      'TGP',
      'Gama GT',
      'Fosfatase Alcalina',
      'Bilirrubina Total',
      'Bilirrubina Direta',
      'Bilirrubina Indireta'
    ]
  },
  minerais: {
    name: 'Minerais e Vitaminas',
    biomarkers: [
      'Ferro',
      'Ferritina',
      'Cálcio',
      'Vitamina D',
      'Vitamina B12',
      'Ácido Fólico',
      'Magnésio',
      'Potássio',
      'Sódio'
    ]
  }
};

export type CategoryKey = keyof typeof BIOMARKER_CATEGORIES;

export function categorizeBiomarker(biomarkerName: string): CategoryKey {
  for (const [key, category] of Object.entries(BIOMARKER_CATEGORIES)) {
    if (category.biomarkers.some(b => 
      biomarkerName.toLowerCase().includes(b.toLowerCase()) ||
      b.toLowerCase().includes(biomarkerName.toLowerCase())
    )) {
      return key as CategoryKey;
    }
  }
  return 'minerais'; // fallback
}

export function getCategoryColor(category: CategoryKey): string {
  const colors: Record<CategoryKey, string> = {
    cardiovascular: 'hsl(var(--chart-1))',
    metabolico: 'hsl(var(--chart-2))',
    hematologico: 'hsl(var(--chart-3))',
    hormonal: 'hsl(var(--chart-4))',
    renal: 'hsl(var(--chart-5))',
    hepatico: 'hsl(var(--chart-1))',
    minerais: 'hsl(var(--chart-2))'
  };
  return colors[category];
}
