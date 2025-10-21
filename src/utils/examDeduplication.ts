interface ExamResult {
  nome: string;
  resultado: string;
  unidade?: string;
  referencia_min?: number | null;
  referencia_max?: number | null;
  status?: string;
  observacao?: string | null;
  explicacao_leiga?: string;
  possiveis_causas_alteracao?: string[] | null;
  [key: string]: any;
}

/**
 * Normaliza nome do exame para facilitar deduplicação
 */
function normalizeExamName(name: string): string {
  if (!name) return "";
  
  // Converter para minúsculas
  let normalized = name.toLowerCase();
  
  // Remover parênteses e conteúdo
  normalized = normalized.replace(/\([^)]*\)/g, '');
  
  // Remover palavras não relevantes
  const noiseWords = ['de', 'da', 'do', 'jejum', 'soro', 'sangue', 'total', '-'];
  const words = normalized.split(/\s+/);
  const filtered = words.filter(w => w.trim() && !noiseWords.includes(w.trim()));
  
  // Normalizar espaços
  normalized = filtered.join(' ').trim();
  
  return normalized;
}

/**
 * Calcula score de completude do exame (quanto mais dados, maior o score)
 */
function calculateExamCompleteness(exam: ExamResult): number {
  let score = 0;
  
  if (exam.resultado) score += 10;
  if (exam.unidade) score += 5;
  if (exam.referencia_min !== null && exam.referencia_min !== undefined) score += 3;
  if (exam.referencia_max !== null && exam.referencia_max !== undefined) score += 3;
  if (exam.status) score += 2;
  if (exam.observacao) score += 2;
  if (exam.explicacao_leiga) score += 1;
  
  return score;
}

/**
 * Remove duplicatas mantendo o exame mais completo
 */
export function deduplicateExams(exams: ExamResult[]): ExamResult[] {
  if (!exams || exams.length === 0) return [];
  
  console.log(`🔍 Deduplicação: processando ${exams.length} exames...`);
  
  const examMap = new Map<string, ExamResult>();
  
  for (const exam of exams) {
    const originalName = exam.nome?.trim() || '';
    if (!originalName) continue;
    
    const normalizedName = normalizeExamName(originalName);
    if (!normalizedName) continue;
    
    // Se já existe, comparar completude
    if (examMap.has(normalizedName)) {
      const existing = examMap.get(normalizedName)!;
      const existingScore = calculateExamCompleteness(existing);
      const newScore = calculateExamCompleteness(exam);
      
      // Manter o mais completo
      if (newScore > existingScore) {
        examMap.set(normalizedName, exam);
        console.log(`   🔄 Duplicata: "${originalName}" (substituído por versão mais completa)`);
      } else {
        console.log(`   🔄 Duplicata: "${originalName}" (descartado)`);
      }
    } else {
      examMap.set(normalizedName, exam);
    }
  }
  
  const uniqueExams = Array.from(examMap.values());
  
  // Ordenar alfabeticamente
  uniqueExams.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  
  const removed = exams.length - uniqueExams.length;
  if (removed > 0) {
    console.log(`✅ Deduplicação: ${exams.length} → ${uniqueExams.length} (${removed} duplicatas removidas)`);
  } else {
    console.log(`✅ Sem duplicatas detectadas`);
  }
  
  return uniqueExams;
}

/**
 * Valida lista de exames (útil para debug)
 */
export function validateExamsList(exams: ExamResult[]): {
  valid: boolean;
  duplicates: string[];
  incomplete: string[];
} {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const incomplete: string[] = [];
  
  for (const exam of exams) {
    const normalized = normalizeExamName(exam.nome);
    
    if (seen.has(normalized)) {
      duplicates.push(exam.nome);
    } else {
      seen.add(normalized);
    }
    
    const score = calculateExamCompleteness(exam);
    if (score < 10) { // Score mínimo: resultado
      incomplete.push(exam.nome);
    }
  }
  
  return {
    valid: duplicates.length === 0 && incomplete.length === 0,
    duplicates,
    incomplete,
  };
}
