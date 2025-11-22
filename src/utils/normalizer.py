"""
Biomarker Normalization Service - Serviço de Normalização de Biomarcadores
Espelha a lógica do BiomarkerNormalizationService.ts do Lovable

Este módulo fornece normalização avançada de biomarcadores laboratoriais usando:
- Busca exata por nome padrão
- Busca por sinônimos
- Busca fuzzy com threshold de 85%
- Detecção de duplicatas
- Validação de payload completo

Sincronizado com: biomarker-specification-v2.json (220 biomarcadores, 20 categorias)

Autor: Sistema HealthTrack
Data: 2025-11-21
Versão: 4.0.0
"""

import json
import re
import unicodedata
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict

try:
    from rapidfuzz import fuzz, process
    RAPIDFUZZ_AVAILABLE = True
except ImportError:
    RAPIDFUZZ_AVAILABLE = False
    print("⚠️ AVISO: rapidfuzz não instalado. Usando fallback de similaridade simples.")


# ========================================
# 📊 ESTRUTURAS DE DADOS
# ========================================

@dataclass
class BiomarkerMatch:
    """Biomarcador normalizado com sucesso"""
    normalized_name: str
    category: str
    category_order: int  # Ordem da categoria (1-20)
    biomarker_order: int  # Ordem dentro da categoria
    unit: str
    synonyms: List[str]
    confidence: float
    match_type: str  # 'exact', 'synonym', 'fuzzy'
    original_name: str


@dataclass
class RejectedBiomarker:
    """Biomarcador rejeitado por não ser reconhecido"""
    original_name: str
    reason: str
    suggestions: List[str]


@dataclass
class DuplicateConflict:
    """Conflito de duplicatas detectado"""
    biomarker_name: str
    occurrences: int
    values: List[Any]
    indices: List[int]


@dataclass
class ValidationResult:
    """Resultado completo da validação do payload"""
    processed_biomarkers: List[Dict[str, Any]]
    rejected_biomarkers: List[Dict[str, Any]]
    duplicate_conflicts: List[Dict[str, Any]]
    stats: Dict[str, Any]


# ========================================
# 🔧 SERVIÇO DE NORMALIZAÇÃO
# ========================================

class BiomarkerNormalizationService:
    """
    Serviço principal de normalização de biomarcadores
    Espelha a lógica do TypeScript do Lovable
    """
    
    FUZZY_THRESHOLD = 85  # Threshold mínimo para match fuzzy (igual ao Lovable)
    
    def __init__(self, spec_path: Optional[str] = None):
        """
        Inicializa o serviço carregando a especificação
        
        Args:
            spec_path: Caminho opcional para especificacao_biomarcadores.json
                      Se None, usa o caminho padrão (mesmo diretório)
        """
        if spec_path is None:
            # Priorizar arquivo v2 reorganizado
            v2_path = Path(__file__).parent.parent / 'data' / 'biomarker-specification-v2.json'
            print(f"🔍 Procurando v2.json em: {v2_path.absolute()}")
            print(f"🔍 Arquivo existe? {v2_path.exists()}")

         if v2_path.exists():
          spec_path = v2_path
         print(f"✅ Usando v2.json: {v2_path}")
         else:
           # Fallback para arquivo antigo
           old_path = Path(__file__).parent.parent.parent / 'especificacao_biomarcadores.json'
           print(f"⚠️ v2.json não encontrado! Usando fallback: {old_path}")
          spec_path = old_path 
        
        self.spec_path = Path(spec_path)
        self.spec_data = self._load_specification()
        self.biomarkers = self.spec_data.get('biomarcadores', [])
        self.synonym_map = self._build_synonym_map()
        
        print(f"✅ BiomarkerNormalizationService inicializado com {len(self.biomarkers)} biomarcadores")
    
    def _load_specification(self) -> Dict:
        """Carrega o arquivo JSON de especificação"""
        try:
            with open(self.spec_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            print(f"✅ Especificação carregada: {data.get('total_biomarcadores', 0)} biomarcadores")
            return data
        except FileNotFoundError:
            print(f"❌ ERRO: Arquivo {self.spec_path} não encontrado!")
            return {'biomarcadores': []}
        except json.JSONDecodeError as e:
            print(f"❌ ERRO ao parsear JSON: {e}")
            return {'biomarcadores': []}
    
    def _build_synonym_map(self) -> Dict[str, Dict]:
        """
        Constrói mapa de sinônimos normalizados -> biomarcador
        Permite busca rápida por sinônimos
        """
        synonym_map = {}
        
        for biomarker in self.biomarkers:
            nome_padrao = biomarker['nome_padrao']
            
            # Adicionar o próprio nome padrão
            normalized_name = self._normalize(nome_padrao)
            synonym_map[normalized_name] = biomarker
            
            # Adicionar todos os sinônimos
            for synonym in biomarker.get('sinonimos', []):
                normalized_synonym = self._normalize(synonym)
                if normalized_synonym and normalized_synonym not in synonym_map:
                    synonym_map[normalized_synonym] = biomarker
        
        print(f"✅ Mapa de sinônimos construído: {len(synonym_map)} entradas")
        return synonym_map
    
    def _normalize(self, text: str) -> str:
        """
        Normaliza texto para comparação
        
        - Remove acentos
        - Converte para minúsculas
        - Remove pontuação (exceto hífen)
        - Remove espaços extras
        
        Args:
            text: Texto para normalizar
            
        Returns:
            Texto normalizado
        """
        if not text:
            return ""
        
        # Remover acentos
        text = unicodedata.normalize('NFD', text)
        text = ''.join(char for char in text if unicodedata.category(char) != 'Mn')
        
        # Minúsculas
        text = text.lower()
        
        # Remover pontuação (mantém hífen e espaços)
        text = re.sub(r'[^\w\s\-]', '', text)
        
        # Remover espaços extras
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def _infer_unit(self, nome_padrao: str) -> str:
        """
        Infere unidade de medida baseado no nome do biomarcador
        
        Args:
            nome_padrao: Nome padrão do biomarcador
            
        Returns:
            Unidade inferida ou string vazia
        """
        nome_lower = nome_padrao.lower()
        
        # Mapeamento de padrões -> unidades
        unit_patterns = {
            'mg/dl': ['colesterol', 'ldl', 'hdl', 'triglicérides', 'triglicerides', 'glicemia', 
                      'glicose', 'ureia', 'creatinina', 'ácido úrico', 'urico', 'cálcio', 
                      'calcio', 'magnésio', 'magnesio', 'vitamina c', 'bilirrubina'],
            'g/dl': ['hemoglobina', 'albumina', 'proteínas totais', 'proteinas totais', 
                     'globulinas', 'chcm'],
            '%': ['hematócrito', 'hematocrito', 'hba1c', 'rdw', 'ist', 'neutrófilos %', 
                  'neutrofilos %', 'linfócitos %', 'linfocitos %', 'monócitos %', 
                  'monocitos %', 'eosinófilos %', 'eosinofilos %', 'basófilos %', 
                  'basofilos %', 'reticulócitos', 'reticulocitos'],
            'ng/ml': ['ferritina', 'psa', 'prolactina', 'igf-1', 'osteocalcina', 'ctx', 
                      'vitamina b1', 'vitamina b2', 'vitamina b3', 'vitamina b5', 
                      'vitamina b6', 'tireoglobulina', 'ácido fólico', 'acido folico'],
            'pg/ml': ['vitamina b12', 'b12', 't3 livre', 'pth', 'testosterona livre'],
            'µui/ml': ['tsh', 'insulina'],
            'mui/ml': ['lh', 'fsh'],
            'ng/dl': ['t4 livre', 'testosterona total', 'cortisol', 'dhea', 'dht', 
                      't3 total', 'estradiol'],
            'µg/dl': ['t4 total', 'ferro', 'ctlf', 'zinco', 'vitamina a', 'sdhea'],
            'u/l': ['tgo', 'ast', 'tgp', 'alt', 'fa', 'fosfatase', 'ggt', 'cpk', 'ldh'],
            '/mm³': ['leucócitos', 'leucocitos', 'hemácias', 'hemacias', 'plaquetas', 
                     'neutrófilos', 'neutrofilos', 'linfócitos', 'linfocitos', 
                     'monócitos', 'monocitos', 'eosinófilos', 'eosinofilos', 
                     'basófilos', 'basofilos'],
            'meq/l': ['sódio', 'sodio', 'potássio', 'potassio', 'na', 'k'],
            'fl': ['vcm'],
            'pg': ['hcm'],
            'mg/l': ['pcr'],
            'µmol/l': ['homocisteína', 'homocisteina', 'frutosamina'],
            'nmol/l': ['shbg'],
            'segundos': ['ptt'],
        }
        
        # Buscar padrões
        for unit, keywords in unit_patterns.items():
            for keyword in keywords:
                if keyword in nome_lower:
                    return unit
        
        return ''  # Unidade desconhecida
    
    def find_biomarker(self, original_name: str) -> Tuple[Optional[BiomarkerMatch], Optional[RejectedBiomarker]]:
        """
        Encontra biomarcador usando busca em 3 níveis (igual ao Lovable)
        
        1. Busca exata no nome padrão
        2. Busca em sinônimos
        3. Busca fuzzy (>= 85% similaridade)
        
        Args:
            original_name: Nome original extraído do laudo
            
        Returns:
            Tupla (BiomarkerMatch ou None, RejectedBiomarker ou None)
        """
        if not original_name or len(original_name.strip()) < 2:
            return (None, RejectedBiomarker(
                original_name=original_name,
                reason="Nome muito curto ou vazio",
                suggestions=[]
            ))
        
        normalized = self._normalize(original_name)
        
        # 1️⃣ BUSCA EXATA
        if normalized in self.synonym_map:
            biomarker = self.synonym_map[normalized]
            return (BiomarkerMatch(
                normalized_name=biomarker['nome_padrao'],
                category=biomarker['categoria'],
                category_order=biomarker.get('category_order', 999),
                biomarker_order=biomarker.get('biomarker_order', 999),
                unit=self._infer_unit(biomarker['nome_padrao']),
                synonyms=biomarker.get('sinonimos', []),
                confidence=1.0,
                match_type='exact',
                original_name=original_name
            ), None)
        
        # 2️⃣ BUSCA EM SINÔNIMOS
        for synonym_normalized, biomarker in self.synonym_map.items():
            if normalized == synonym_normalized:
                return (BiomarkerMatch(
                    normalized_name=biomarker['nome_padrao'],
                    category=biomarker['categoria'],
                    category_order=biomarker.get('category_order', 999),
                    biomarker_order=biomarker.get('biomarker_order', 999),
                    unit=self._infer_unit(biomarker['nome_padrao']),
                    synonyms=biomarker.get('sinonimos', []),
                    confidence=0.95,
                    match_type='synonym',
                    original_name=original_name
                ), None)
        
        # 3️⃣ BUSCA FUZZY
        best_match, confidence = self._fuzzy_search(normalized)

        if best_match and confidence >= self.FUZZY_THRESHOLD:
            biomarker = self.synonym_map[best_match]
            return (BiomarkerMatch(
                normalized_name=biomarker['nome_padrao'],
                category=biomarker['categoria'],
                category_order=biomarker.get('category_order', 999),
                biomarker_order=biomarker.get('biomarker_order', 999),
                unit=self._infer_unit(biomarker['nome_padrao']),
                synonyms=biomarker.get('sinonimos', []),
                confidence=confidence / 100.0,  # Converter para 0-1
                match_type='fuzzy',
                original_name=original_name
            ), None)
        
        # ❌ NÃO ENCONTRADO
        suggestions = self._get_suggestions(normalized)
        return (None, RejectedBiomarker(
            original_name=original_name,
            reason=f"Biomarcador não reconhecido (melhor match: {confidence:.0f}% < {self.FUZZY_THRESHOLD}%)",
            suggestions=suggestions
        ))
    
    def _fuzzy_search(self, normalized_name: str) -> Tuple[Optional[str], float]:
        """
        Busca fuzzy usando rapidfuzz (se disponível) ou fallback simples
        
        Args:
            normalized_name: Nome normalizado para buscar
            
        Returns:
            Tupla (melhor_match, confiança_percentual)
        """
        if RAPIDFUZZ_AVAILABLE:
            # Usar rapidfuzz (mais preciso)
            best_match = process.extractOne(
                normalized_name,
                self.synonym_map.keys(),
                scorer=fuzz.ratio,
                score_cutoff=self.FUZZY_THRESHOLD
            )
            
            if best_match:
                return (best_match[0], best_match[1])
            return (None, 0.0)
        else:
            # Fallback: Levenshtein simples
            best_match = None
            best_score = 0.0
            
            for key in self.synonym_map.keys():
                score = self._levenshtein_similarity(normalized_name, key) * 100
                if score > best_score:
                    best_score = score
                    best_match = key
            
            return (best_match, best_score)
    
    def _levenshtein_similarity(self, s1: str, s2: str) -> float:
        """
        Calcula similaridade de Levenshtein (0.0 a 1.0)
        Fallback quando rapidfuzz não está disponível
        """
        if s1 == s2:
            return 1.0
        if not s1 or not s2:
            return 0.0
        
        len1, len2 = len(s1), len(s2)
        distances = [[0] * (len2 + 1) for _ in range(len1 + 1)]
        
        for i in range(len1 + 1):
            distances[i][0] = i
        for j in range(len2 + 1):
            distances[0][j] = j
        
        for i in range(1, len1 + 1):
            for j in range(1, len2 + 1):
                cost = 0 if s1[i-1] == s2[j-1] else 1
                distances[i][j] = min(
                    distances[i-1][j] + 1,
                    distances[i][j-1] + 1,
                    distances[i-1][j-1] + cost
                )
        
        max_len = max(len1, len2)
        if max_len == 0:
            return 1.0
        
        distance = distances[len1][len2]
        return 1 - (distance / max_len)
    
    def _get_suggestions(self, normalized_name: str, limit: int = 3) -> List[str]:
        """
        Retorna sugestões de biomarcadores similares
        
        Args:
            normalized_name: Nome normalizado
            limit: Número máximo de sugestões
            
        Returns:
            Lista de sugestões de nomes padrão
        """
        if RAPIDFUZZ_AVAILABLE:
            matches = process.extract(
                normalized_name,
                self.synonym_map.keys(),
                scorer=fuzz.ratio,
                limit=limit
            )
            return [self.synonym_map[match[0]]['nome_padrao'] for match in matches]
        else:
            # Fallback simples
            all_scores = []
            for key, biomarker in self.synonym_map.items():
                score = self._levenshtein_similarity(normalized_name, key)
                all_scores.append((biomarker['nome_padrao'], score))
            
            all_scores.sort(key=lambda x: x[1], reverse=True)
            return [name for name, _ in all_scores[:limit]]
    
    def detect_duplicates(self, biomarkers: List[BiomarkerMatch], exam_date: Optional[str] = None) -> List[DuplicateConflict]:
        """
        Detecta biomarcadores duplicados no payload
        
        Args:
            biomarkers: Lista de biomarcadores processados
            exam_date: Data do exame (opcional, para contexto)
            
        Returns:
            Lista de conflitos de duplicatas detectados
        """
        name_occurrences: Dict[str, List[Tuple[int, Any]]] = {}
        
        for idx, biomarker in enumerate(biomarkers):
            normalized = biomarker.normalized_name
            if normalized not in name_occurrences:
                name_occurrences[normalized] = []
            name_occurrences[normalized].append((idx, biomarker.original_name))
        
        conflicts = []
        for name, occurrences in name_occurrences.items():
            if len(occurrences) > 1:
                conflicts.append(DuplicateConflict(
                    biomarker_name=name,
                    occurrences=len(occurrences),
                    values=[val for _, val in occurrences],
                    indices=[idx for idx, _ in occurrences]
                ))
        
        return conflicts
    
    def validate_payload(self, payload: Dict[str, Any]) -> ValidationResult:
        """
        Valida payload completo de biomarcadores (MÉTODO PRINCIPAL)
        
        Formato esperado:
        {
            "biomarcadores": [
                {"nome": str, "valor": any, "unidade": str (opcional), "referencia": str (opcional)},
                ...
            ],
            "data_exame": str (opcional)
        }
        
        Args:
            payload: Payload com lista de biomarcadores
            
        Returns:
            ValidationResult com biomarcadores processados, rejeitados e duplicatas
        """
        biomarcadores = payload.get('biomarcadores', [])
        exam_date = payload.get('data_exame')
        
        processed: List[BiomarkerMatch] = []
        rejected: List[RejectedBiomarker] = []
        
        # Processar cada biomarcador
        for bio in biomarcadores:
            nome = bio.get('nome', '')
            match, rejection = self.find_biomarker(nome)
            
            if match:
                processed.append(match)
            elif rejection:
                rejected.append(rejection)
        
        # Detectar duplicatas
        duplicates = self.detect_duplicates(processed, exam_date)
        
        # Construir resultado
        stats = {
            'total': len(biomarcadores),
            'processed': len(processed),
            'rejected': len(rejected),
            'duplicates': len(duplicates),
            'exact_matches': len([m for m in processed if m.match_type == 'exact']),
            'synonym_matches': len([m for m in processed if m.match_type == 'synonym']),
            'fuzzy_matches': len([m for m in processed if m.match_type == 'fuzzy']),
        }
        
        return ValidationResult(
            processed_biomarkers=[asdict(m) for m in processed],
            rejected_biomarkers=[asdict(r) for r in rejected],
            duplicate_conflicts=[asdict(d) for d in duplicates],
            stats=stats
        )
    
    def get_specification_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas da especificação carregada"""
        return {
            'total_biomarkers': len(self.biomarkers),
            'total_synonyms': len(self.synonym_map),
            'categories': len(set(b['categoria'] for b in self.biomarkers)),
            'version': self.spec_data.get('versao', 'unknown'),
            'last_update': self.spec_data.get('data_atualizacao', 'unknown'),
        }
