"""
Exam Parser - Extração inteligente de exames laboratoriais
Integração completa: Normalizer + Validators + Gemini AI
Versão: 6.0.0 - Migrado para Gemini (mais barato e eficiente)
"""

import json
import re
from typing import List, Dict, Any, Optional
from pathlib import Path
import google.generativeai as genai

# Imports locais
from src.utils.validators import (
    normalize_value,
    extract_numeric_value,
    validate_value_format,
    parse_reference_range,
    validate_exam_structure,
    normalize_unit,
    calculate_exam_status,
    deduplicate_exams
)


# ========================================
# PROMPT OTIMIZADO PARA LABORATÓRIOS BRASILEIROS
# ========================================

def build_gemini_prompt(
    extracted_text: str,
    biomarker_examples: str,
    extracted_name: Optional[str] = None,
    extracted_birth_date: Optional[str] = None,
    extracted_lab: Optional[str] = None
) -> str:
    """Constrói prompt otimizado para Gemini - extração de exames brasileiros"""
    
    # Hints de dados pré-extraídos
    extraction_hints = ""
    if extracted_name:
        extraction_hints += f"\n✅ Nome do Paciente: {extracted_name}"
    if extracted_birth_date:
        extraction_hints += f"\n✅ Data de Nascimento: {extracted_birth_date}"
    if extracted_lab:
        extraction_hints += f"\n✅ Laboratório: {extracted_lab}"
    
    if extraction_hints:
        extraction_hints = f"\n## 🔍 DADOS PRÉ-EXTRAÍDOS{extraction_hints}\n"
    
    prompt = f"""Você é um especialista em extração de dados de exames laboratoriais BRASILEIROS.

{extraction_hints}

## ⚠️ REGRAS CRÍTICAS PARA VALORES BRASILEIROS

### 1. CONVERSÃO DECIMAL (CRÍTICO!)
Laboratórios brasileiros usam VÍRGULA como separador decimal:
- "38,0 mm/h" → valor: "38.0", valor_numerico: 38.0
- "2,90 g/dL" → valor: "2.9", valor_numerico: 2.9
- "0,86 UI/mL" → valor: "0.86", valor_numerico: 0.86
- "1.250 células" → valor: "1250", valor_numerico: 1250 (ponto é separador de milhar!)

### 2. VALORES COM OPERADORES
Preserve operadores MAS extraia número:
- "< 0,5 mg/dL" → valor: "<0.5", valor_numerico: 0.5
- "> 100 UI/mL" → valor: ">100", valor_numerico: 100
- ">= 30" → valor: ">=30", valor_numerico: 30
- "Superior a 8 UI/mL" → valor: ">8", valor_numerico: null (sem número exato)

### 3. MÚLTIPLOS RESULTADOS (CRÍTICO!)
Se houver DUAS linhas de resultado para o mesmo exame, SEMPRE use o VALOR NUMÉRICO:

Exemplo ERRADO:
```
Resultado: Superior a 8 UI/mL
Resultado: 32,00 UI/mL
```
❌ Extrair apenas: "Superior a 8 UI/mL"

Exemplo CORRETO:
✅ Extrair: valor: "32.0", valor_numerico: 32.0

### 4. VALORES QUALITATIVOS
Retorne SEM valor_numerico:
- "Reagente" → valor: "Reagente", valor_numerico: null
- "Não Reagente" → valor: "Não Reagente", valor_numerico: null
- "Negativo" → valor: "Negativo", valor_numerico: null
- "Positivo" → valor: "Positivo", valor_numerico: null

Se tiver PADRÃO + qualitativo:
- "Reagente - Nuclear Pontilhado Fino 1/80" → valor: "Reagente - Nuclear Pontilhado Fino 1/80"

### 5. VALORES DE REFERÊNCIA
Extraia min e max separadamente:
- "0 - 20 mm/h" → reference_min: 0, reference_max: 20
- "Inferior a 8 UI/mL" → reference_min: null, reference_max: 8
- "Superior a 40 mg/dL" → reference_min: 40, reference_max: null
- "12 a 36 mg/dL" → reference_min: 12, reference_max: 36

## 📋 EXAMES VÁLIDOS NO DATABASE

Use PREFERENCIALMENTE estes nomes padronizados:

{biomarker_examples}

## 🔬 EXPANSÃO DE EXAMES COMPOSTOS

### ⚠️ NUNCA retorne apenas "Hemograma: Análise completa"
### ✅ SEMPRE expanda em biomarcadores individuais

**Hemograma → 15+ itens:**
- Hemácias, Hemoglobina, Hematócrito, VCM, HCM, CHCM, RDW
- Leucócitos, Neutrófilos (absoluto), Neutrófilos (%), Linfócitos (absoluto), Linfócitos (%)
- Monócitos, Eosinófilos, Basófilos, Plaquetas

**Lipidograma → 5 itens:**
- Colesterol Total, HDL, LDL, VLDL, Triglicerídeos

**Função Hepática → 7 itens:**
- TGO (AST), TGP (ALT), Gama GT, Fosfatase Alcalina
- Bilirrubina Total, Bilirrubina Direta, Bilirrubina Indireta

**Função Renal → 4 itens:**
- Ureia, Creatinina, Ácido Úrico, TFG

**Tireoide → 3+ itens:**
- TSH, T4 Livre, T3 Livre

## 📤 FORMATO DE SAÍDA JSON

```json
{{
  "nome": "Nome Completo do Paciente",
  "data_nascimento": "DD/MM/YYYY",
  "laboratorio": "Nome do Laboratório",
  "data_exame": "DD/MM/YYYY",
  "exams": [
    {{
      "exam_name": "Nome Padrão do Exame",
      "value": "32.0" ou "Reagente" (string, COM operador se houver),
      "value_numeric": 32.0 ou null (float, SEM operador),
      "unit": "UI/mL",
      "reference_min": 0.0,
      "reference_max": 10.0,
      "reference_text": "Não Reagente: < 10,0 Elia U/mL",
      "method": "ELISA" (opcional),
      "status": "alto" | "baixo" | "normal" | "indeterminado"
    }}
  ]
}}
```

## 🎯 REGRAS FINAIS

1. **SEMPRE** converta vírgulas para pontos em valores numéricos
2. **SEMPRE** expanda exames compostos (Hemograma, Lipidograma, etc)
3. **SEMPRE** extraia valor numérico quando houver dois resultados
4. **NUNCA** pule exames mesmo sem valor de referência
5. **SEMPRE** use nomes padronizados da lista acima quando possível
6. Para exames NÃO listados, use o nome mais claro encontrado no laudo

---

## 📄 TEXTO DO EXAME:

{extracted_text}

Retorne APENAS o JSON, sem explicações."""

    return prompt


# ========================================
# FUNÇÃO PRINCIPAL DE PARSING
# ========================================

def parse_lab_report(
    extracted_text: str,
    anthropic_client,
    normalization_service=None,
    extracted_name: Optional[str] = None,
    extracted_birth_date: Optional[str] = None,
    extracted_lab: Optional[str] = None,
    max_tokens: int = 8192
) -> Dict[str, Any]:
    """
    Extrai dados estruturados de laudo laboratorial
    
    Args:
        extracted_text: Texto extraído do PDF/imagem
        anthropic_client: Cliente Anthropic configurado
        normalization_service: Instância de BiomarkerNormalizationService (opcional)
        extracted_name: Nome pré-extraído (hint)
        extracted_birth_date: Data pré-extraída (hint)
        extracted_lab: Laboratório pré-extraído (hint)
        max_tokens: Limite de tokens para resposta do Claude
        
    Returns:
        dict com dados estruturados e validados
    """
    
    # Limitar tamanho do texto
    max_chars = 100000
    if len(extracted_text) > max_chars:
        extracted_text = extracted_text[:max_chars]
        print(f'⚠️ Texto truncado para {max_chars} caracteres')
    
    # Construir lista de biomarcadores válidos
    biomarker_examples = ""
    if normalization_service:
        examples_list = []
        # Pegar primeiros 100 biomarcadores
        for bio in normalization_service.biomarkers[:100]:
            line = f"- {bio['nome_padrao']}"
            if bio.get('unidade'):
                line += f" ({bio['unidade']})"
            if bio.get('sinonimos', [])[:2]:
                line += f" | Também: {', '.join(bio['sinonimos'][:2])}"
            examples_list.append(line)
        
        biomarker_examples = '\n'.join(examples_list)
        print(f'✅ Usando {len(normalization_service.biomarkers)} biomarcadores da especificação')
    else:
        biomarker_examples = "(Serviço de normalização não disponível)"
        print('⚠️ Normalization service não disponível')
    
    # Construir prompt
    prompt = build_gemini_prompt(
        extracted_text,
        biomarker_examples,
        extracted_name,
        extracted_birth_date,
        extracted_lab
    )
    
    # Chamar Claude
    try:
        print('🤖 Chamando Claude Haiku para parsing...')
        
        response = anthropic_client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=max_tokens,
            temperature=0,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        # Extrair JSON da resposta
        response_text = response.content[0].text
        
        # Tentar encontrar JSON no texto
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if not json_match:
            print('❌ Não foi possível extrair JSON da resposta')
            return {
                'error': 'Falha ao extrair JSON',
                'raw_response': response_text[:500]
            }
        
        parsed_data = json.loads(json_match.group(0))
        print(f'✅ JSON parseado com sucesso')
        
        # Validar e processar exames
        exams_raw = parsed_data.get('exams', [])
        if not exams_raw:
            exams_raw = parsed_data.get('exames', [])
        
        exams_processed = []
        
        for exam in exams_raw:
            # Validar estrutura básica
            is_valid, error = validate_exam_structure(exam)
            if not is_valid:
                print(f'⚠️ Exame inválido: {error}')
                continue
            
            # Normalizar e processar
            processed_exam = process_exam(exam, normalization_service)
            exams_processed.append(processed_exam)
        
        # Deduplicar
        exams_final = deduplicate_exams(exams_processed)
        
        print(f'✅ Processados {len(exams_final)} exames (de {len(exams_raw)} brutos)')
        
        # Construir resultado final
        result = {
            'nome': parsed_data.get('nome', extracted_name or ''),
            'data_nascimento': parsed_data.get('data_nascimento', extracted_birth_date or ''),
            'laboratorio': parsed_data.get('laboratorio', extracted_lab or ''),
            'data_exame': parsed_data.get('data_exame', ''),
            'exams': exams_final,
            'metadata': {
                'total_exams': len(exams_final),
                'extraction_method': 'claude_haiku',
                'normalized_exams': sum(1 for e in exams_final if e.get('biomarker_id'))
            }
        }
        
        return result
        
    except json.JSONDecodeError as e:
        print(f'❌ Erro ao parsear JSON: {e}')
        return {'error': f'JSON inválido: {str(e)}'}
    
    except Exception as e:
        print(f'❌ Erro no parsing: {e}')
        return {'error': str(e)}


# ========================================
# PARSING COM GEMINI (NOVA VERSÃO - MAIS BARATA)
# ========================================

def parse_lab_report_with_gemini(
    extracted_text: str,
    gemini_model: str = 'gemini-2.0-flash-exp',
    normalization_service=None,
    extracted_name: Optional[str] = None,
    extracted_birth_date: Optional[str] = None,
    extracted_lab: Optional[str] = None,
    max_tokens: int = 8192
) -> Dict[str, Any]:
    """
    Extrai dados estruturados de laudo laboratorial usando Gemini

    Args:
        extracted_text: Texto extraído do PDF/imagem
        gemini_model: Modelo Gemini a usar
        normalization_service: Instância de BiomarkerNormalizationService (opcional)
        extracted_name: Nome pré-extraído (hint)
        extracted_birth_date: Data pré-extraída (hint)
        extracted_lab: Laboratório pré-extraído (hint)
        max_tokens: Limite de tokens para resposta do Gemini

    Returns:
        dict com dados estruturados e validados
    """

    # Limitar tamanho do texto
    max_chars = 100000
    if len(extracted_text) > max_chars:
        extracted_text = extracted_text[:max_chars]
        print(f'⚠️ Texto truncado para {max_chars} caracteres')

    # Construir lista de biomarcadores válidos
    biomarker_examples = ""
    if normalization_service:
        examples_list = []
        # Pegar primeiros 100 biomarcadores
        for bio in normalization_service.biomarkers[:100]:
            line = f"- {bio['nome_padrao']}"
            if bio.get('unidade'):
                line += f" ({bio['unidade']})"
            if bio.get('sinonimos', [])[:2]:
                line += f" | Também: {', '.join(bio['sinonimos'][:2])}"
            examples_list.append(line)

        biomarker_examples = '\n'.join(examples_list)
        print(f'✅ Usando {len(normalization_service.biomarkers)} biomarcadores da especificação')
    else:
        biomarker_examples = "(Serviço de normalização não disponível)"
        print('⚠️ Normalization service não disponível')

    # Construir prompt
    prompt = build_gemini_prompt(
        extracted_text,
        biomarker_examples,
        extracted_name,
        extracted_birth_date,
        extracted_lab
    )

    # Chamar Gemini
    try:
        print(f'🤖 Chamando Gemini {gemini_model} para parsing...')

        model = genai.GenerativeModel(
            model_name=gemini_model,
            generation_config={
                'temperature': 0,
                'max_output_tokens': max_tokens,
            }
        )

        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Remover markdown se presente
        if response_text.startswith('```'):
            response_text = re.sub(r'^```json\s*|\s*```$', '', response_text, flags=re.MULTILINE)

        # Tentar encontrar JSON no texto
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if not json_match:
            print('❌ Não foi possível extrair JSON da resposta')
            return {
                'error': 'Falha ao extrair JSON',
                'raw_response': response_text[:500]
            }

        parsed_data = json.loads(json_match.group(0))
        print(f'✅ JSON parseado com sucesso')

        # Validar e processar exames
        exams_raw = parsed_data.get('exams', [])
        if not exams_raw:
            exams_raw = parsed_data.get('exames', [])

        exams_processed = []

        for exam in exams_raw:
            # Validar estrutura básica
            is_valid, error = validate_exam_structure(exam)
            if not is_valid:
                print(f'⚠️ Exame inválido: {error}')
                continue

            # Normalizar e processar
            processed_exam = process_exam(exam, normalization_service)
            exams_processed.append(processed_exam)

        # Deduplicar
        exams_final = deduplicate_exams(exams_processed)

        print(f'✅ Processados {len(exams_final)} exames (de {len(exams_raw)} brutos)')

        # Construir resultado final
        result = {
            'nome': parsed_data.get('nome', extracted_name or ''),
            'data_nascimento': parsed_data.get('data_nascimento', extracted_birth_date or ''),
            'laboratorio': parsed_data.get('laboratorio', extracted_lab or ''),
            'data_exame': parsed_data.get('data_exame', ''),
            'exams': exams_final,
            'metadata': {
                'total_exams': len(exams_final),
                'extraction_method': f'gemini_{gemini_model}',
                'normalized_exams': sum(1 for e in exams_final if e.get('biomarker_id'))
            }
        }

        return result

    except json.JSONDecodeError as e:
        print(f'❌ Erro ao parsear JSON: {e}')
        return {'error': f'JSON inválido: {str(e)}'}

    except Exception as e:
        print(f'❌ Erro no parsing: {e}')
        return {'error': str(e)}


# ========================================
# PROCESSAMENTO INDIVIDUAL DE EXAME
# ========================================

def process_exam(exam: Dict[str, Any], normalization_service=None) -> Dict[str, Any]:
    """
    Processa e valida um exame individual
    
    Args:
        exam: Exame bruto do Claude
        normalization_service: Serviço de normalização (opcional)
        
    Returns:
        Exame processado e validado
    """
    processed = {}
    
    # Nome do exame
    exam_name = exam.get('exam_name', '').strip()
    processed['exam_name'] = exam_name
    
    # Normalizar com o serviço (se disponível)
    biomarker_id = None
    normalized_name = exam_name
    category = None
    category_order = None
    biomarker_order = None

    if normalization_service and exam_name:
        match, rejection = normalization_service.find_biomarker(exam_name)
        if match:
            normalized_name = match.normalized_name
            biomarker_id = f"bio_{normalized_name.lower().replace(' ', '_')}"
            category = match.category
            category_order = match.category_order
            biomarker_order = match.biomarker_order
            print(f'✅ Normalizado: {exam_name} → {normalized_name} | Categoria: {category} | Orders: cat={category_order}, bio={biomarker_order}')
        elif rejection:
            print(f'⚠️ Não normalizado: {exam_name} ({rejection.reason})')

    processed['normalized_name'] = normalized_name
    if biomarker_id:
        processed['biomarker_id'] = biomarker_id
    if category:
        processed['category'] = category
    if category_order is not None:
        processed['category_order'] = category_order
    if biomarker_order is not None:
        processed['biomarker_order'] = biomarker_order
    
    # Valor
    value_raw = exam.get('value', '')
    if value_raw is not None:
        value_normalized = normalize_value(str(value_raw))
        processed['value'] = value_normalized
        
        # Valor numérico
        value_numeric = extract_numeric_value(value_normalized)
        if value_numeric is not None:
            processed['value_numeric'] = value_numeric
    
    # Unidade
    unit = exam.get('unit', '').strip()
    if unit:
        processed['unit'] = normalize_unit(unit)
    
    # Referências
    ref_min = exam.get('reference_min')
    ref_max = exam.get('reference_max')
    ref_text = exam.get('reference_text', '').strip()
    
    # Se não tiver ref_min/max mas tiver ref_text, tentar extrair
    if (ref_min is None and ref_max is None) and ref_text:
        parsed_refs = parse_reference_range(ref_text)
        ref_min = parsed_refs.get('reference_min')
        ref_max = parsed_refs.get('reference_max')
    
    if ref_min is not None:
        processed['reference_min'] = float(ref_min)
    if ref_max is not None:
        processed['reference_max'] = float(ref_max)
    if ref_text:
        processed['reference_text'] = ref_text
    
    # Método
    method = exam.get('method', '').strip()
    if method:
        processed['method'] = method
    
    # Status
    status = exam.get('status', '').lower()
    if not status or status not in ['normal', 'baixo', 'alto', 'indeterminado']:
        # Calcular automaticamente
        status = calculate_exam_status(
            processed.get('value_numeric'),
            processed.get('reference_min'),
            processed.get('reference_max')
        )
    processed['status'] = status
    
    # Resultado qualitativo (se aplicável)
    qualitativos = ['reagente', 'não reagente', 'nao reagente', 'positivo', 'negativo',
                    'indetectável', 'indetectavel', 'detectável', 'detectavel']
    if value_normalized and value_normalized.lower() in qualitativos:
    processed['qualitative_result'] = value_normalized

# Log para debug de ordenação
if 'category_order' in processed or 'biomarker_order' in processed:
    print(f"📦 Retornando com orders: {exam_name} | cat_order={processed.get('category_order')}, bio_order={processed.get('biomarker_order')}")

return processed


# ========================================
# FUNÇÕES DE UTILIDADE
# ========================================

def validate_parsed_result(result: Dict[str, Any]) -> bool:
    """
    Valida resultado parseado
    
    Returns:
        True se válido, False caso contrário
    """
    if not result or 'exams' not in result:
        return False
    
    exams = result.get('exams', [])
    if not exams or len(exams) == 0:
        return False
    
    # Verificar se pelo menos 50% dos exames têm valor
    exams_with_value = sum(1 for e in exams if e.get('value'))
    if exams_with_value / len(exams) < 0.5:
        return False
    
    return True


def get_parsing_stats(result: Dict[str, Any]) -> Dict[str, Any]:
    """Retorna estatísticas do parsing"""
    if not result or 'exams' not in result:
        return {'error': 'Resultado inválido'}
    
    exams = result.get('exams', [])
    
    return {
        'total_exams': len(exams),
        'with_numeric_value': sum(1 for e in exams if e.get('value_numeric') is not None),
        'with_reference': sum(1 for e in exams if e.get('reference_min') or e.get('reference_max')),
        'normalized': sum(1 for e in exams if e.get('biomarker_id')),
        'status_counts': {
            'normal': sum(1 for e in exams if e.get('status') == 'normal'),
            'alto': sum(1 for e in exams if e.get('status') == 'alto'),
            'baixo': sum(1 for e in exams if e.get('status') == 'baixo'),
            'indeterminado': sum(1 for e in exams if e.get('status') == 'indeterminado')
        }
    }
