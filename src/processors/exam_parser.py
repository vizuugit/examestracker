"""
Parser de Exames com Claude Haiku
Extrai, normaliza e deduplica resultados de exames
Economia estimada: ~66% vs Claude Sonnet
"""

import re
import json
import uuid
from typing import List, Dict, Any
from src.config import (
    CLAUDE_HAIKU_MODEL,
    CLAUDE_MAX_TOKENS,
    CLAUDE_TEMPERATURE,
    EXAM_NAME_SIMILARITY_THRESHOLD
)


def parse_exams_from_text(extracted_text: str, anthropic_client) -> List[Dict[str, Any]]:
    """
    Parseia exames usando Claude Haiku com prompt otimizado
    Processa documentos completos com chunking automático
    
    Args:
        extracted_text: Texto extraído do PDF
        anthropic_client: Cliente Anthropic
        
    Returns:
        Lista de exames estruturados
    """
    # Processar texto completo em chunks se necessário
    max_chunk_size = 12000  # ~3000 tokens
    
    if len(extracted_text) > max_chunk_size:
        print(f'📄 Documento longo detectado: {len(extracted_text)} caracteres')
        return _parse_long_document(extracted_text, anthropic_client, max_chunk_size)
    else:
        return _parse_single_chunk(extracted_text, anthropic_client)


def _parse_single_chunk(text: str, anthropic_client) -> List[Dict[str, Any]]:
    """Parseia um único chunk de texto"""
    
    # Lista de biomarcadores válidos (top 80 mais comuns)
    valid_biomarkers = """
BIOMARCADORES VÁLIDOS (use nomes padronizados):
- GLICEMIA JEJUM, HbA1c, INSULINA, HOMA IR, PEPTÍDEO C
- CT (Colesterol Total), LDL, HDL, VLDL, TG (Triglicérides)
- CREATININA, URÉIA, TFG CKD-EPI, ÁCIDO ÚRICO
- TGO/AST, TGP/ALT, GGT, FA (Fosfatase Alcalina), ALBUMINA
- TSH, T3 LIVRE, T4 LIVRE, T3 TOTAL, T4 TOTAL
- TESTOSTERONA TOTAL, TESTOSTERONA LIVRE, ESTRADIOL, PROGESTERONA
- CORTISOL, DHEA-S, PROLACTINA, LH, FSH
- 25-OH VIT D, VIT B12, ÁCIDO FÓLICO, FERRITINA, FERRO
- PCR ULTRA SENSÍVEL, VHS, HOMOCISTEÍNA, FIBRINOGÊNIO
- HEMOGLOBINA, HEMATÓCRITO, HEMÁCIAS, LEUCÓCITOS, PLAQUETAS
- NEUTRÓFILOS, LINFÓCITOS, MONÓCITOS, EOSINÓFILOS, BASÓFILOS
- VCM, HCM, CHCM, RDW
- PSA TOTAL, PSA LIVRE, CEA, CA 125, CA 19-9
- SÓDIO, POTÁSSIO, CÁLCIO, MAGNÉSIO, FÓSFORO, CLORO
- PROTEÍNAS TOTAIS, BILIRRUBINA TOTAL, BBD, BBI
"""
    
    prompt = f"""Você é um extrator especializado de laudos laboratoriais. Analise o laudo e extraia TODOS os biomarcadores.

═══════════════════════════════════════
REGRAS CRÍTICAS DE EXTRAÇÃO
═══════════════════════════════════════

1. **FORMATO DE SAÍDA**: Retorne APENAS um array JSON válido. Nenhum texto antes ou depois.

2. **VALIDAÇÕES OBRIGATÓRIAS**:
   ❌ "Laboratório XYZ" NÃO é nome de pessoa
   ❌ "Data de Nascimento" NÃO é data do exame
   ❌ Ignore cabeçalhos, rodapés e informações administrativas
   ✅ Extraia apenas valores de biomarcadores laboratoriais

3. **EXPANSÃO DE EXAMES COMPOSTOS** (CRÍTICO):
   - Se encontrar "Hemograma Completo", extraia 13+ biomarcadores individuais:
     Hemácias, Hemoglobina, Hematócrito, VCM, HCM, CHCM, RDW,
     Leucócitos, Neutrófilos, Linfócitos, Monócitos, Eosinófilos, Basófilos, Plaquetas
   
   - Se encontrar "Lipidograma", extraia 5 biomarcadores:
     Colesterol Total (CT), LDL, HDL, VLDL, Triglicérides (TG)
   
   - Se encontrar "Função Renal", extraia:
     Creatinina, Ureia, TFG CKD-EPI, Ácido Úrico
   
   - Se encontrar "Função Hepática", extraia:
     TGO/AST, TGP/ALT, GGT, Fosfatase Alcalina, Bilirrubinas, Albumina

4. **EXTRAÇÃO DE VALORES NUMÉRICOS**:
   ✅ "95.5" → extraia "95.5"
   ✅ "38.0 mm/h" → value: "38.0", unit: "mm/h"
   ✅ "< 1.0" → extraia "< 1.0" (manter operadores)
   ✅ "Positivo" ou "Negativo" → extraia como string

5. **VALORES DE REFERÊNCIA**:
   ✅ "10-50" → reference_min: "10", reference_max: "50"
   ✅ "até 20" → reference_min: null, reference_max: "20"
   ✅ ">= 30" → reference_min: "30", reference_max: null
   ✅ Sempre extraia como strings, não como números

6. **STATUS DO EXAME**:
   - Se valor estiver ABAIXO do normal → "baixo"
   - Se valor estiver DENTRO do normal → "normal"
   - Se valor estiver ACIMA do normal → "alto"
   - Se não houver referência → "sem_referencia"

{valid_biomarkers}

═══════════════════════════════════════
FORMATO JSON DE SAÍDA
═══════════════════════════════════════

[
  {{
    "exam_name": "VHS",
    "value": "38.0",
    "unit": "mm/h",
    "reference_min": "0",
    "reference_max": "20",
    "status": "alto",
    "method": "Westergren",
    "observation": null
  }},
  {{
    "exam_name": "GLICEMIA JEJUM",
    "value": "95",
    "unit": "mg/dL",
    "reference_min": "70",
    "reference_max": "99",
    "status": "normal",
    "method": null,
    "observation": null
  }},
  {{
    "exam_name": "HEMOGLOBINA",
    "value": "14.2",
    "unit": "g/dL",
    "reference_min": "12.0",
    "reference_max": "16.0",
    "status": "normal",
    "method": null,
    "observation": null
  }}
]

═══════════════════════════════════════
LAUDO A PROCESSAR
═══════════════════════════════════════

{text[:12000]}

═══════════════════════════════════════
RESPOSTA (SOMENTE JSON)
═══════════════════════════════════════"""
    
    try:
        message = anthropic_client.messages.create(
            model=CLAUDE_HAIKU_MODEL,
            max_tokens=CLAUDE_MAX_TOKENS,
            temperature=CLAUDE_TEMPERATURE,
            messages=[{"role": "user", "content": prompt}]
        )
        
        response_text = message.content[0].text
        
        # Extrair JSON da resposta
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            exams = json.loads(json_match.group(0))
            print(f'✅ Claude Haiku: {len(exams)} biomarcadores extraídos')
            return exams
        else:
            print('⚠️ Claude Haiku: Resposta sem JSON válido')
            return []
        
    except Exception as e:
        print(f'❌ Claude Haiku falhou: {e}')
        import traceback
        traceback.print_exc()
        return []


def _parse_long_document(text: str, anthropic_client, chunk_size: int) -> List[Dict[str, Any]]:
    """
    Parseia documentos longos dividindo em chunks com overlap
    Evita perder biomarcadores nas bordas dos chunks
    """
    overlap = 1000  # 1000 chars de overlap entre chunks
    chunks = []
    
    # Dividir texto em chunks com overlap
    for i in range(0, len(text), chunk_size - overlap):
        chunk = text[i:i + chunk_size]
        chunks.append(chunk)
    
    print(f'📦 Processando {len(chunks)} chunks com overlap...')
    
    all_exams = []
    seen_exams = set()  # Para deduplicar entre chunks
    
    for idx, chunk in enumerate(chunks):
        print(f'🔄 Processando chunk {idx + 1}/{len(chunks)}...')
        chunk_exams = _parse_single_chunk(chunk, anthropic_client)
        
        # Adicionar apenas exames únicos (evitar duplicatas do overlap)
        for exam in chunk_exams:
            exam_key = f"{exam.get('exam_name', '')}-{exam.get('value', '')}"
            if exam_key not in seen_exams:
                all_exams.append(exam)
                seen_exams.add(exam_key)
    
    print(f'✅ Total de biomarcadores extraídos de todos os chunks: {len(all_exams)}')
    return all_exams


def clean_reference_values(exames: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Normaliza valores de referência (min/max)
    
    Args:
        exames: Lista de exames brutos
        
    Returns:
        Lista de exames com referências normalizadas
    """
    for exam in exames:
        # Garantir que reference_min e reference_max sejam float ou None
        for field in ['reference_min', 'reference_max']:
            value = exam.get(field)
            
            if value is None or value == '':
                exam[field] = None
            elif isinstance(value, str):
                # Limpar string e converter
                clean_value = value.strip().replace(',', '.')
                try:
                    exam[field] = float(clean_value)
                except ValueError:
                    exam[field] = None
            elif isinstance(value, (int, float)):
                exam[field] = float(value)
        
        # Garantir que value seja numérico quando possível
        value = exam.get('value')
        if isinstance(value, str):
            clean_value = value.strip().replace(',', '.')
            # Remover unidades que possam estar grudadas
            clean_value = re.sub(r'[a-zA-Z/%]+$', '', clean_value).strip()
            try:
                exam['value'] = float(clean_value)
            except ValueError:
                pass  # Manter como string se não for conversível
    
    return exames


def deduplicate_exams(exames: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Remove exames duplicados, mantendo o mais completo
    
    Args:
        exames: Lista de exames (pode ter duplicatas)
        
    Returns:
        Lista dedupilcada
    """
    from difflib import SequenceMatcher
    
    def are_similar(name1: str, name2: str, threshold: float = EXAM_NAME_SIMILARITY_THRESHOLD) -> bool:
        """Verifica se dois nomes de exames são similares"""
        n1 = name1.lower().strip()
        n2 = name2.lower().strip()
        return SequenceMatcher(None, n1, n2).ratio() >= threshold
    
    def completeness_score(exam: Dict[str, Any]) -> int:
        """Calcula pontuação de completude de um exame"""
        score = 0
        if exam.get('value') not in [None, '']:
            score += 10
        if exam.get('reference_min') is not None:
            score += 5
        if exam.get('reference_max') is not None:
            score += 5
        if exam.get('unit'):
            score += 3
        if exam.get('status'):
            score += 2
        if exam.get('method'):
            score += 1
        return score
    
    # Agrupar exames similares
    groups = []
    for exam in exames:
        exam_name = exam.get('exam_name', '')
        
        # Tentar adicionar a um grupo existente
        added = False
        for group in groups:
            if are_similar(group[0]['exam_name'], exam_name):
                group.append(exam)
                added = True
                break
        
        # Criar novo grupo se necessário
        if not added:
            groups.append([exam])
    
    # Manter o mais completo de cada grupo
    deduplicated = []
    for group in groups:
        if len(group) == 1:
            deduplicated.append(group[0])
        else:
            # Ordenar por completude e pegar o melhor
            sorted_group = sorted(group, key=completeness_score, reverse=True)
            deduplicated.append(sorted_group[0])
            print(f'🔄 Deduplicado: {sorted_group[0]["exam_name"]} ({len(group)} versões)')
    
    print(f'✅ Deduplicação: {len(exames)} -> {len(deduplicated)} exames')
    return deduplicated


def assign_biomarker_ids(exames: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Adiciona IDs únicos a cada exame
    
    Args:
        exames: Lista de exames
        
    Returns:
        Lista de exames com biomarker_id
    """
    for exam in exames:
        if 'biomarker_id' not in exam:
            exam['biomarker_id'] = str(uuid.uuid4())
    
    return exames
