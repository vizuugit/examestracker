import Fuse from 'fuse.js';
import biomarkerSpec from '@/data/biomarker-specification.json';

export interface BiomarkerMatch {
  normalizedName: string;
  category: string;
  unit: string;
  synonyms: string[];
  confidence: number;
  matchType: 'exact' | 'synonym' | 'fuzzy';
  originalName: string;
}

export interface RejectedBiomarker {
  originalName: string;
  reason: string;
  suggestions: string[];
  similarity?: number;
}

export interface DuplicateConflict {
  biomarkerName: string;
  conflictType: string;
  values: Array<{
    value: string | number;
    date: string;
    examId?: string;
  }>;
  requiresManualReview: boolean;
}

export interface ValidationResult {
  success: boolean;
  processedBiomarkers: BiomarkerMatch[];
  rejectedBiomarkers: RejectedBiomarker[];
  duplicates: DuplicateConflict[];
  stats: {
    total: number;
    processed: number;
    rejected: number;
    exactMatches: number;
    synonymMatches: number;
    fuzzyMatches: number;
  };
}

interface BiomarkerSpecItem {
  nome_padrao: string;
  categoria: string;
  unidade: string;
  sinonimos: string[];
  formato_referencia: string;
}

export class BiomarkerNormalizationService {
  private fuseInstance: Fuse<BiomarkerSpecItem>;
  private biomarkers: BiomarkerSpecItem[];
  private synonymMap: Map<string, BiomarkerSpecItem>;

  constructor() {
    this.biomarkers = biomarkerSpec.biomarcadores as BiomarkerSpecItem[];
    this.synonymMap = new Map();
    
    // Construir mapa de sinônimos para busca rápida
    this.biomarkers.forEach(bio => {
      const normalized = this.normalize(bio.nome_padrao);
      this.synonymMap.set(normalized, bio);
      
      bio.sinonimos.forEach(syn => {
        const normalizedSyn = this.normalize(syn);
        this.synonymMap.set(normalizedSyn, bio);
      });
    });

    // Configurar Fuse para fuzzy matching (85% threshold)
    this.fuseInstance = new Fuse(this.biomarkers, {
      keys: ['nome_padrao', 'sinonimos'],
      threshold: 0.15, // 85% de similaridade
      includeScore: true,
      minMatchCharLength: 3,
      ignoreLocation: true,
    });
  }

  /**
   * Normaliza texto removendo acentos, espaços extras e convertendo para minúsculas
   */
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, '') // Remove pontuação
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
  }

  /**
   * Valida se o nome do biomarcador tem comprimento válido
   */
  private validateName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: 'Nome vazio' };
    }
    if (name.length < 2) {
      return { valid: false, error: 'Nome muito curto (mínimo 2 caracteres)' };
    }
    if (name.length > 150) {
      return { valid: false, error: 'Nome muito longo (máximo 150 caracteres)' };
    }
    return { valid: true };
  }

  /**
   * Valida se o valor é válido
   */
  private validateValue(value: any): { valid: boolean; error?: string } {
    if (value === null || value === undefined || value === '') {
      return { valid: false, error: 'Valor vazio' };
    }
    
    // Aceitar strings e números
    if (typeof value !== 'string' && typeof value !== 'number') {
      return { valid: false, error: 'Tipo de valor inválido' };
    }

    return { valid: true };
  }

  /**
   * Encontra um biomarcador usando busca em 3 níveis
   */
  private findBiomarker(originalName: string): BiomarkerMatch | RejectedBiomarker {
    const normalized = this.normalize(originalName);

    // Nível 1: Busca exata no nome padrão
    for (const bio of this.biomarkers) {
      if (this.normalize(bio.nome_padrao) === normalized) {
        return {
          normalizedName: bio.nome_padrao,
          category: bio.categoria,
          unit: bio.unidade,
          synonyms: bio.sinonimos,
          confidence: 1.0,
          matchType: 'exact',
          originalName,
        };
      }
    }

    // Nível 2: Busca em sinônimos
    const synonymMatch = this.synonymMap.get(normalized);
    if (synonymMatch) {
      return {
        normalizedName: synonymMatch.nome_padrao,
        category: synonymMatch.categoria,
        unit: synonymMatch.unidade,
        synonyms: synonymMatch.sinonimos,
        confidence: 0.95,
        matchType: 'synonym',
        originalName,
      };
    }

    // Nível 3: Fuzzy matching (85% threshold)
    const fuzzyResults = this.fuseInstance.search(normalized);
    
    if (fuzzyResults.length === 0) {
      // Nenhuma correspondência encontrada
      const topSuggestions = this.fuseInstance.search(normalized, { limit: 3 });
      return {
        originalName,
        reason: 'Biomarcador não reconhecido',
        suggestions: topSuggestions.map(r => r.item.nome_padrao),
        similarity: topSuggestions[0]?.score ? 1 - topSuggestions[0].score : 0,
      };
    }

    if (fuzzyResults.length === 1) {
      const match = fuzzyResults[0];
      const confidence = 1 - (match.score || 0);
      
      if (confidence >= 0.85) {
        return {
          normalizedName: match.item.nome_padrao,
          category: match.item.categoria,
          unit: match.item.unidade,
          synonyms: match.item.sinonimos,
          confidence,
          matchType: 'fuzzy',
          originalName,
        };
      } else {
        return {
          originalName,
          reason: 'Similaridade insuficiente (< 85%)',
          suggestions: [match.item.nome_padrao],
          similarity: confidence,
        };
      }
    }

    // Múltiplas correspondências (ambiguidade)
    return {
      originalName,
      reason: 'Ambiguidade: múltiplas correspondências possíveis',
      suggestions: fuzzyResults.slice(0, 5).map(r => r.item.nome_padrao),
      similarity: fuzzyResults[0]?.score ? 1 - fuzzyResults[0].score : 0,
    };
  }

  /**
   * Detecta duplicatas em uma lista de biomarcadores
   */
  private detectDuplicates(
    biomarkers: BiomarkerMatch[],
    examDate?: string
  ): DuplicateConflict[] {
    const grouped = new Map<string, BiomarkerMatch[]>();

    // Agrupar por nome normalizado
    biomarkers.forEach(bio => {
      const key = bio.normalizedName;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(bio);
    });

    const duplicates: DuplicateConflict[] = [];

    // Detectar conflitos
    grouped.forEach((group, biomarkerName) => {
      if (group.length > 1) {
        duplicates.push({
          biomarkerName,
          conflictType: 'Múltiplas entradas detectadas',
          values: group.map(g => ({
            value: g.originalName,
            date: examDate || new Date().toISOString(),
          })),
          requiresManualReview: true,
        });
      }
    });

    return duplicates;
  }

  /**
   * Processa um payload completo de biomarcadores
   */
  public validatePayload(payload: {
    biomarcadores: Array<{
      nome: string;
      valor: any;
      unidade?: string;
      referencia?: string;
    }>;
    data_exame?: string;
  }): ValidationResult {
    const processed: BiomarkerMatch[] = [];
    const rejected: RejectedBiomarker[] = [];
    const stats = {
      total: payload.biomarcadores.length,
      processed: 0,
      rejected: 0,
      exactMatches: 0,
      synonymMatches: 0,
      fuzzyMatches: 0,
    };

    for (const bio of payload.biomarcadores) {
      // Validar nome
      const nameValidation = this.validateName(bio.nome);
      if (!nameValidation.valid) {
        rejected.push({
          originalName: bio.nome,
          reason: nameValidation.error!,
          suggestions: [],
        });
        stats.rejected++;
        continue;
      }

      // Validar valor
      const valueValidation = this.validateValue(bio.valor);
      if (!valueValidation.valid) {
        rejected.push({
          originalName: bio.nome,
          reason: `Valor inválido: ${valueValidation.error}`,
          suggestions: [],
        });
        stats.rejected++;
        continue;
      }

      // Buscar correspondência
      const result = this.findBiomarker(bio.nome);

      if ('normalizedName' in result) {
        // Match encontrado
        processed.push(result);
        stats.processed++;
        
        switch (result.matchType) {
          case 'exact':
            stats.exactMatches++;
            break;
          case 'synonym':
            stats.synonymMatches++;
            break;
          case 'fuzzy':
            stats.fuzzyMatches++;
            break;
        }
      } else {
        // Rejeitado
        rejected.push(result);
        stats.rejected++;
      }
    }

    // Detectar duplicatas
    const duplicates = this.detectDuplicates(processed, payload.data_exame);

    return {
      success: rejected.length === 0 && duplicates.filter(d => d.requiresManualReview).length === 0,
      processedBiomarkers: processed,
      rejectedBiomarkers: rejected,
      duplicates,
      stats,
    };
  }

  /**
   * Retorna estatísticas sobre a base de biomarcadores
   */
  public getSpecificationStats() {
    const categories = new Set(this.biomarkers.map(b => b.categoria));
    
    return {
      totalBiomarkers: this.biomarkers.length,
      totalCategories: categories.size,
      totalSynonyms: this.biomarkers.reduce((acc, b) => acc + b.sinonimos.length, 0),
      categories: Array.from(categories),
    };
  }
}

// Instância singleton
export const biomarkerNormalizationService = new BiomarkerNormalizationService();
