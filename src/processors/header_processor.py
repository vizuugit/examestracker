"""
Processamento de Header do Exame
Extração com cache S3 + Gemini Flash Vision (mais rápido e barato)
Economia estimada: ~97% em custos de visão comparado ao Claude
"""

import re
import io
import json
import fitz  # PyMuPDF
from typing import Dict, Any, Optional
from src.config import GEMINI_API_KEY, GEMINI_VISION_MODEL, GEMINI_MAX_TOKENS, GEMINI_TEMPERATURE
import google.generativeai as genai
from PIL import Image
from src.processors.vision_text_extractor import _compress_image_for_vision


def extract_patient_identifiers_from_text(text: str) -> Dict[str, Optional[str]]:
    """
    Extração rápida via regex (sem IA) - OTIMIZADA para aumentar cache hits

    Args:
        text: Texto extraído do PDF

    Returns:
        Dict com nome e data_nascimento (ou None)
    """
    # ✅ PROTEÇÃO: Validar entrada
    if not text or not isinstance(text, str):
        print("⚠️ extract_patient_identifiers_from_text recebeu texto inválido")
        return {'nome': None, 'data_nascimento': None}

    identifiers = {
        'nome': None,
        'data_nascimento': None
    }

    # 🚀 OTIMIZAÇÃO 1: Buscar em primeiras 1000 caracteres (header geralmente está no topo)
    header_text = text[:1000]

    # 🚀 OTIMIZAÇÃO 2: Múltiplos padrões para data de nascimento
    date_patterns = [
        r'(?:Data\s+(?:de\s+)?Nasc(?:imento)?|Nascimento|D\.?\s*Nasc\.?)[:\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{4})',  # "Data Nascimento: 01/01/1990"
        r'Nasc\.?[:\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{4})',  # "Nasc: 01/01/1990"
        r'\b(\d{2}[\/\-]\d{2}[\/\-](?:19|20)\d{2})\b',  # Datas entre 1900-2099
    ]

    for pattern in date_patterns:
        match = re.search(pattern, header_text, re.IGNORECASE)
        if match:
            identifiers['data_nascimento'] = match.group(1).replace('-', '/')
            break

    # Se não achou com contexto, pegar primeira data válida (nascimento geralmente é antes de outras datas)
    if not identifiers['data_nascimento']:
        dates = re.findall(r'\b(\d{2}[\/\-]\d{2}[\/\-](?:19|20)\d{2})\b', header_text)
        if dates:
            identifiers['data_nascimento'] = dates[0].replace('-', '/')

    # 🚀 OTIMIZAÇÃO 3: Múltiplos padrões para nome do paciente
    name_patterns = [
        r'(?:Paciente|Nome|Patient)[:\s]+([A-Z][a-zá-ú]+(?:\s+[A-Z][a-zá-ú]+)+)',  # "Paciente: João Silva"
        r'\n([A-Z][A-ZÁ-Ú\s]{8,})\n',  # Nome todo em maiúsculas (comum em laudos)
        r'\b([A-Z][a-zá-ú]+(?:\s+[A-Z][a-zá-ú]+){2,})\b',  # 3+ palavras capitalizadas (nome completo)
    ]

    for pattern in name_patterns:
        match = re.search(pattern, header_text, re.MULTILINE)
        if match:
            name = match.group(1).strip()
            # Validar nome (mínimo 8 caracteres, 2 palavras, não contém números)
            if len(name) >= 8 and len(name.split()) >= 2 and not re.search(r'\d', name):
                identifiers['nome'] = name.title() if name.isupper() else name
                break

    # Se não achou com contexto, usar padrão genérico
    if not identifiers['nome']:
        names = re.findall(r'\b([A-Z][a-zá-ú]+(?:\s+[A-Z][a-zá-ú]+)+)\b', header_text)
        for name in names:
            # Filtrar nomes comuns de campos/títulos
            if (len(name) >= 8 and len(name.split()) >= 2 and
                not re.search(r'\d', name) and
                name.lower() not in ['laboratorio', 'hospital', 'resultado', 'exame']):
                identifiers['nome'] = name
                break

    if identifiers['nome'] or identifiers['data_nascimento']:
        print(f"📋 Identificadores extraídos via regex: nome={bool(identifiers['nome'])}, data_nasc={bool(identifiers['data_nascimento'])}")

    return identifiers


def extract_lab_hint_from_text(text: str) -> str:
    """
    Detecta nome do laboratório no texto (dica para cache) - OTIMIZADO

    Args:
        text: Texto extraído

    Returns:
        str: Nome do laboratório ou vazio
    """
    # 🚀 OTIMIZAÇÃO: Buscar apenas no início do documento (primeiras 500 caracteres)
    header_text = text[:500]

    # Regex para laboratórios comuns (expandido)
    lab_patterns = [
        r'Laborat[óo]rio\s+([A-Z][a-zA-ZÁ-Ú\s]+?)(?:\n|$|\s{2,})',  # "Laboratório Nome"
        r'LAB[\.:\s]+([A-Z][a-zA-ZÁ-Ú\s]+?)(?:\n|$|\s{2,})',  # "LAB: Nome"
        r'([A-Z][a-zA-ZÁ-Ú]+)\s+Laborat[óo]rio',  # "Nome Laboratório"
        r'([A-Z][A-ZÁ-Ú\s]{3,20})\s+(?:LTDA|S/A|SA)',  # Razão social
    ]

    for pattern in lab_patterns:
        match = re.search(pattern, header_text, re.IGNORECASE | re.MULTILINE)
        if match:
            lab_name = match.group(1).strip()
            # Filtrar nomes muito curtos ou muito longos
            if 3 <= len(lab_name) <= 50:
                return lab_name

    return ''


def extract_header_with_vision(pdf_path: str, gemini_client=None) -> Dict[str, Any]:
    """
    Extração com Gemini Flash Vision (mais barato e rápido que Claude)
    
    Args:
        pdf_path: Caminho do PDF
        gemini_client: Cliente Gemini (opcional, será criado se None)
        
    Returns:
        Dict com dados do header extraídos
    """
    try:
        # Configurar Gemini (se ainda não foi configurado)
        if not gemini_client:
            if not GEMINI_API_KEY:
                raise Exception('GEMINI_API_KEY não configurada')
            genai.configure(api_key=GEMINI_API_KEY)
        
        # Converter primeira página para imagem usando PyMuPDF
        doc = fitz.open(pdf_path)
        
        if len(doc) == 0:
            raise Exception('PDF não possui páginas')
        
        # Renderizar primeira página em resolução otimizada
        page = doc[0]
        pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))  # 1.5x = suficiente para header
        img_bytes = pix.tobytes("jpeg")  # JPEG ao invés de PNG
        doc.close()
        
        # ✅ NOVO: Comprimir imagem antes de enviar ao Gemini
        print(f"🗜️ Comprimindo imagem do header...")
        original_size = len(img_bytes)
        img_bytes = _compress_image_for_vision(img_bytes, max_dimension=1024, quality=85)
        compressed_size = len(img_bytes)
        print(f"🗜️ Header comprimido: {original_size/1024:.1f}KB → {compressed_size/1024:.1f}KB ({100*(1-compressed_size/original_size):.0f}% menor)")
        
        # Preparar imagem para Gemini
        import PIL.Image
        image = PIL.Image.open(io.BytesIO(img_bytes))
        
        # Prompt otimizado para Gemini
        prompt = """Analise esta primeira página de um laudo de exames médicos e extraia:

1. **Nome do Paciente**: Nome completo do paciente (mínimo 2 palavras)
2. **Data de Nascimento**: No formato DD/MM/YYYY
3. **Data do Exame**: Data em que o exame foi realizado (DD/MM/YYYY)
4. **Laboratório**: Nome do laboratório que emitiu o laudo

IMPORTANTE: Retorne APENAS um objeto JSON válido, sem texto adicional:
{
  "paciente": "Nome Completo do Paciente",
  "data_nascimento": "DD/MM/YYYY",
  "data_exame": "DD/MM/YYYY",
  "laboratorio": "Nome do Laboratório"
}

Se não encontrar algum campo, use null."""
        
        # Chamar Gemini Flash Vision
        model = genai.GenerativeModel(
            model_name=GEMINI_VISION_MODEL,
            generation_config={
                'temperature': GEMINI_TEMPERATURE,
                'max_output_tokens': GEMINI_MAX_TOKENS,
            }
        )
        
        response = model.generate_content([prompt, image])
        response_text = response.text.strip()
        
        # Remover markdown se presente
        if response_text.startswith('```'):
            response_text = re.sub(r'^```json\s*|\s*```$', '', response_text, flags=re.MULTILINE)
        
        json_match = re.search(r'\{[^}]+\}', response_text, re.DOTALL)
        if json_match:
            header_data = json.loads(json_match.group(0))
            print(f'✅ Gemini Flash Vision: Header extraído')
            return header_data
        else:
            print('⚠️ Gemini Flash Vision: Resposta sem JSON válido')
            print(f'Resposta recebida: {response_text[:200]}')
            return {}
        
    except Exception as e:
        print(f'❌ Gemini Flash Vision falhou: {e}')
        return {}


def extract_header_with_cache(
    pdf_path: str,
    extracted_text: str,
    vision_client,
    cache
) -> Dict[str, Any]:
    """
    Orquestrador: tenta identificação rápida -> cache -> visão
    
    Args:
        pdf_path: Caminho do PDF
        extracted_text: Texto já extraído
        vision_client: Cliente de visão (Gemini ou Claude)
        cache: Instância de HeaderCacheS3
        
    Returns:
        Dict com header completo
    """
    # Passo 1: Identificação rápida (regex)
    identifiers = extract_patient_identifiers_from_text(extracted_text)
    lab_hint = extract_lab_hint_from_text(extracted_text)
    
    nome = identifiers.get('nome')
    data_nasc = identifiers.get('data_nascimento')
    
    # Passo 2: Tentar cache (se temos identificadores)
    if nome and data_nasc:
        print(f'🔍 Verificando cache para: {nome[:20]}... ({data_nasc})')
        cached_header = cache.get(nome, data_nasc, lab_hint)
        if cached_header:
            print(f'✅ Cache HIT! Economia de ~500ms e custo de Vision API')
            return cached_header
        print('❌ Cache MISS - Paciente não encontrado no cache')
    else:
        print(f'⚠️ Regex não extraiu identificadores suficientes (nome={bool(nome)}, data_nasc={bool(data_nasc)})')
        print('   Pulando verificação de cache, indo direto para Vision API')

    # Passo 3: Usar Gemini Flash Vision (cache miss)
    print('🔍 Usando Gemini Flash Vision para extrair header...')
    header = extract_header_with_vision(pdf_path, vision_client)
    
    # Passo 4: Salvar no cache (se válido)
    # Suporta tanto 'nome' quanto 'paciente' no retorno
    patient_name = header.get('paciente') or header.get('nome')
    birth_date = header.get('data_nascimento')
    
    if patient_name and birth_date:
        cache.put(patient_name, birth_date, header)
    
    return header
