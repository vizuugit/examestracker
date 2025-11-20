import { categorizeBiomarker } from '@/utils/biomarkerCategories';
import { normalizeBiomarkerWithTable } from '@/utils/biomarkerNormalization';

/**
 * Cache LRU (Least Recently Used) para categorização de biomarcadores
 */
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 500) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move para o final (mais recente)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove se já existe para reordenar
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Adiciona no final
    this.cache.set(key, value);
    
    // Remove o mais antigo se exceder tamanho máximo
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercentage: ((this.cache.size / this.maxSize) * 100).toFixed(1)
    };
  }
}

// Cache global para categorização
const categoryCache = new LRUCache<string, string>(500);
const categoryWithSourceCache = new LRUCache<string, { category: string; source: string }>(500);

// Contadores para estatísticas de performance
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Normaliza nome da categoria para unificar variações
 */
export function normalizeCategoryName(category: string | null): string {
  if (!category) return 'outros';
  
  const normalized = category.toLowerCase().trim();
  
  const categoryMap: Record<string, string> = {
    // Hematológico
    'hemograma': 'hematologico',
    'hematológico': 'hematologico',
    'hematologia': 'hematologico',
    'sangue': 'hematologico',
    'serie vermelha': 'hematologico',
    'série vermelha': 'hematologico',
    'serie branca': 'hematologico',
    'série branca': 'hematologico',
    'eritrograma': 'hematologico',
    'leucograma': 'hematologico',
    'série plaquetária': 'hematologico',
    'serie plaquetaria': 'hematologico',
    
    // Metabólico
    'metabolismo': 'metabolico',
    'metabólico': 'metabolico',
    'lipídico': 'metabolico',
    'lipidico': 'metabolico',
    'perfil lipídico': 'metabolico',
    'perfil lipidico': 'metabolico',
    'glicemia': 'metabolico',
    'bioquímica': 'metabolico',
    'bioquimica': 'metabolico',
    'risco cardiovascular': 'metabolico',
    'fator cardiovascular': 'metabolico',
    'cardiovascular': 'metabolico',
    'glicemia e diabetes': 'metabolico',
    'metabolismo da glicose': 'metabolico',
    
    // Hepático
    'fígado': 'hepatico',
    'figado': 'hepatico',
    'hepático': 'hepatico',
    'hepatico': 'hepatico',
    'função hepática': 'hepatico',
    'funcao hepatica': 'hepatico',
    
    // Renal
    'rim': 'renal',
    'rins': 'renal',
    'função renal': 'renal',
    'funcao renal': 'renal',
    
    // Íons
    'eletrólitos': 'ions',
    'eletrolitos': 'ions',
    'íons': 'ions',
    'ionograma': 'ions',
    
    // Hormonal
    'hormônio': 'hormonal',
    'hormonio': 'hormonal',
    'hormônios': 'hormonal',
    'hormonios': 'hormonal',
    'tireoide': 'hormonal',
    'tireóide': 'hormonal',
    'hormônios sexuais': 'hormonal',
    'hormonios sexuais': 'hormonal',
    'hormônios tireoidianos': 'hormonal',
    'hormonios tireoidianos': 'hormonal',
    'função tireoideana': 'hormonal',
    'funcao tireoideana': 'hormonal',
    
    // Vitaminas e Minerais
    'vitamina': 'vitaminas_minerais',
    'vitaminas': 'vitaminas_minerais',
    'mineral': 'vitaminas_minerais',
    'minerais': 'vitaminas_minerais',
    'ferro': 'vitaminas_minerais',
    'minerais e vitaminas': 'vitaminas_minerais',
    'vitaminas e minerais': 'vitaminas_minerais',
    'metabolismo do ferro': 'vitaminas_minerais',
    'metais': 'vitaminas_minerais',
    'metais pesados': 'vitaminas_minerais',
    
    // Marcadores Inflamatórios
    'inflamação': 'marcadores_inflamatorios',
    'inflamacao': 'marcadores_inflamatorios',
    'inflamatório': 'marcadores_inflamatorios',
    'inflamatorio': 'marcadores_inflamatorios',
    'marcadores inflamatórios': 'marcadores_inflamatorios',
    'marcadores inflamatorios': 'marcadores_inflamatorios',
    'imunologia': 'marcadores_inflamatorios',
    
    // Marcadores Musculares
    'músculo': 'marcadores_musculares',
    'musculo': 'marcadores_musculares',
    'músculos': 'marcadores_musculares',
    'musculos': 'marcadores_musculares',
    'muscular': 'marcadores_musculares',
    'marcadores musculares': 'marcadores_musculares',
    
    // Marcadores Prostáticos
    'próstata': 'marcadores_prostaticos',
    'prostata': 'marcadores_prostaticos',
    'prostático': 'marcadores_prostaticos',
    'prostatico': 'marcadores_prostaticos',
    'marcadores prostáticos': 'marcadores_prostaticos',
    'marcadores prostaticos': 'marcadores_prostaticos'
  };
  
  return categoryMap[normalized] || normalized;
}

/**
 * Serviço centralizado para obter a categoria de um biomarcador
 * Com cache LRU para otimização de performance
 * 
 * Ordem de prioridade:
 * 1. Tabela de Normalização (normalizeBiomarkerWithTable)
 * 2. Banco de Dados (dbCategory)
 * 3. Função Heurística (categorizeBiomarker)
 * 4. Normalização Final (normalizeCategoryName)
 * 
 * @param biomarkerName - Nome do biomarcador
 * @param dbCategory - Categoria do banco de dados (opcional)
 * @returns Categoria normalizada
 */
export function getBiomarkerCategory(biomarkerName: string, dbCategory?: string | null): string {
  // Criar chave única para cache (incluindo dbCategory para evitar colisões)
  const cacheKey = `${biomarkerName}|${dbCategory || 'null'}`;
  
  // Verificar cache primeiro
  const cached = categoryCache.get(cacheKey);
  if (cached !== undefined) {
    cacheHits++;
    return cached;
  }
  
  cacheMisses++;
  
  // 1️⃣ Tentar tabela de normalização primeiro (fonte mais confiável)
  const tableMatch = normalizeBiomarkerWithTable(biomarkerName);
  if (tableMatch?.category) {
    const result = normalizeCategoryName(tableMatch.category);
    categoryCache.set(cacheKey, result);
    return result;
  }
  
  // 2️⃣ Se não encontrou, usar categoria do banco de dados
  if (dbCategory) {
    const result = normalizeCategoryName(dbCategory);
    categoryCache.set(cacheKey, result);
    return result;
  }
  
  // 3️⃣ Última alternativa: função heurística
  const heuristicCategory = categorizeBiomarker(biomarkerName);
  const result = normalizeCategoryName(heuristicCategory);
  categoryCache.set(cacheKey, result);
  return result;
}

/**
 * Retorna informações sobre a fonte da categoria
 * Com cache LRU para otimização
 * Útil para debugging e validação
 */
export function getBiomarkerCategoryWithSource(biomarkerName: string, dbCategory?: string | null): {
  category: string;
  source: 'normalization_table' | 'database' | 'heuristic';
} {
  // Criar chave única para cache
  const cacheKey = `${biomarkerName}|${dbCategory || 'null'}`;
  
  // Verificar cache primeiro
  const cached = categoryWithSourceCache.get(cacheKey);
  if (cached) {
    cacheHits++;
    return cached as { category: string; source: 'normalization_table' | 'database' | 'heuristic' };
  }
  
  cacheMisses++;
  
  const tableMatch = normalizeBiomarkerWithTable(biomarkerName);
  if (tableMatch?.category) {
    const result = {
      category: normalizeCategoryName(tableMatch.category),
      source: 'normalization_table' as const
    };
    categoryWithSourceCache.set(cacheKey, result);
    return result;
  }
  
  if (dbCategory) {
    const result = {
      category: normalizeCategoryName(dbCategory),
      source: 'database' as const
    };
    categoryWithSourceCache.set(cacheKey, result);
    return result;
  }
  
  const heuristicCategory = categorizeBiomarker(biomarkerName);
  const result = {
    category: normalizeCategoryName(heuristicCategory),
    source: 'heuristic' as const
  };
  categoryWithSourceCache.set(cacheKey, result);
  return result;
}

/**
 * Limpa o cache de categorização
 * Útil para testes ou quando há atualizações nas regras de categorização
 */
export function clearCategorizationCache(): void {
  categoryCache.clear();
  categoryWithSourceCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}

/**
 * Retorna estatísticas do cache e performance
 * Útil para monitoramento e otimização
 */
export function getCategorizationStats() {
  const totalRequests = cacheHits + cacheMisses;
  const hitRate = totalRequests > 0 ? ((cacheHits / totalRequests) * 100).toFixed(1) : '0.0';
  
  return {
    cache: {
      category: categoryCache.getStats(),
      categoryWithSource: categoryWithSourceCache.getStats()
    },
    performance: {
      cacheHits,
      cacheMisses,
      totalRequests,
      hitRatePercentage: hitRate,
      efficiency: hitRate
    }
  };
}
