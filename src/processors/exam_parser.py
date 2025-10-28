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
    Parseia exames usando Claude Haiku
    
    Args:
        extracted_text: Texto extraído do PDF
        anthropic_client: Cliente Anthropic
        
    Returns:
        Lista de exames estruturados
    """
    prompt = f"""Analise este laudo de exames e extraia TODOS os resultados no formato JSON.

**REGRAS CRÍTICAS:**
1. **Valores numéricos**: Sempre use ponto decimal (não vírgula). Ex: 12.5 não 12,5
2. **Valores de referência**: Extraia min e max quando disponíveis
3. **Unidades**: Mantenha exatamente como aparecem no laudo
4. **Status**: "normal", "alto", "baixo" baseado nos valores de referência
5. **Hemograma**: Se houver "Hemograma", extraia TODOS os componentes individuais (hemácias, leucócitos, plaquetas, etc.)
6. **Lipidograma**: Se houver "Lipidograma", extraia TODOS os componentes (colesterol total, HDL, LDL, triglicerídeos)

**FORMATO DE SAÍDA (JSON):**
```json
[
  {{
    "exam_name": "Nome do Exame",
    "value": 12.5,
    "unit": "mg/dL",
    "reference_min": 10.0,
    "reference_max": 50.0,
    "status": "normal",
    "method": "Método usado (opcional)",
    "observation": "Observação (opcional)"
  }}
]
```

**TEXTO DO LAUDO:**
{extracted_text}

Retorne APENAS o array JSON, sem texto adicional."""
    
    try:
        message = anthropic_client.messages.create(
            model=CLAUDE_HAIKU_MODEL,
            max_tokens=CLAUDE_MAX_TOKENS,
            temperature=CLAUDE_TEMPERATURE,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        response_text = message.content[0].text
        
        # Extrair JSON da resposta
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            exams = json.loads(json_match.group(0))
            print(f'✅ Claude Haiku: {len(exams)} exames parseados')
            return exams
        else:
            print('⚠️ Claude Haiku: Resposta sem JSON válido')
            return []
        
    except Exception as e:
        print(f'❌ Claude Haiku falhou: {e}')
        import traceback
        traceback.print_exc()
        return []


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
