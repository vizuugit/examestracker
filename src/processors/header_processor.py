"""
Processamento de Header do Exame
Extração com cache S3 + Claude Vision (somente quando necessário)
Economia estimada: ~15% em chamadas Vision
"""

import re
import io
import base64
import fitz  # PyMuPDF
from typing import Dict, Any, Optional
from src.config import CLAUDE_MODEL


def extract_patient_identifiers_from_text(text: str) -> Dict[str, Optional[str]]:
    """
    Extração rápida via regex (sem IA)
    
    Args:
        text: Texto extraído do PDF
        
    Returns:
        Dict com nome e data_nascimento (ou None)
    """
    identifiers = {
        'nome': None,
        'data_nascimento': None
    }
    
    # Regex para data de nascimento (DD/MM/YYYY)
    date_pattern = r'\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b'
    dates = re.findall(date_pattern, text)
    if dates:
        identifiers['data_nascimento'] = dates[0].replace('-', '/')
    
    # Regex para nome (linhas com 2+ palavras capitalizadas)
    name_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b'
    names = re.findall(name_pattern, text)
    
    # Pegar o primeiro nome válido
    for name in names:
        if len(name) >= 8 and len(name.split()) >= 2:
            identifiers['nome'] = name
            break
    
    return identifiers


def extract_lab_hint_from_text(text: str) -> str:
    """
    Detecta nome do laboratório no texto (dica para cache)
    
    Args:
        text: Texto extraído
        
    Returns:
        str: Nome do laboratório ou vazio
    """
    # Regex para laboratórios comuns
    lab_patterns = [
        r'Laborat[óo]rio\s+([A-Z][a-zA-Z\s]+)',
        r'LAB\s+([A-Z][a-zA-Z\s]+)',
        r'([A-Z][a-zA-Z]+)\s+Laborat[óo]rio'
    ]
    
    for pattern in lab_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
    
    return ''


def extract_header_with_vision(pdf_path: str, anthropic_client) -> Dict[str, Any]:
    """
    Extração com Claude Vision (pago, mas preciso)
    
    Args:
        pdf_path: Caminho do PDF
        anthropic_client: Cliente Anthropic
        
    Returns:
        Dict com dados do header extraídos
    """
    try:
        # Converter primeira página para imagem usando PyMuPDF
        doc = fitz.open(pdf_path)
        
        if len(doc) == 0:
            raise Exception('PDF não possui páginas')
        
        # Renderizar primeira página em alta resolução
        page = doc[0]
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom para melhor qualidade
        img_bytes = pix.tobytes("png")
        doc.close()
        
        # Converter para base64
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        
        # Prompt para Claude Vision
        prompt = """Extraia as seguintes informações da primeira página deste laudo de exames:

1. **Nome do Paciente**: Nome completo (mínimo 2 palavras)
2. **Data de Nascimento**: Formato DD/MM/YYYY
3. **Laboratório**: Nome do laboratório que emitiu o laudo

Retorne APENAS um JSON válido no formato:
{
  "nome": "Nome Completo",
  "data_nascimento": "DD/MM/YYYY",
  "laboratorio": "Nome do Lab"
}

Se não encontrar algum campo, use null."""
        
        # Chamar Claude Vision
        message = anthropic_client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=500,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": img_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        )
        
        # Parsear resposta
        response_text = message.content[0].text
        
        # Extrair JSON da resposta
        import json
        json_match = re.search(r'\{[^}]+\}', response_text, re.DOTALL)
        if json_match:
            header_data = json.loads(json_match.group(0))
            print(f'✅ Claude Vision: Header extraído')
            return header_data
        else:
            print('⚠️ Claude Vision: Resposta sem JSON válido')
            return {}
        
    except Exception as e:
        print(f'❌ Claude Vision falhou: {e}')
        return {}


def extract_header_with_cache(
    pdf_path: str,
    extracted_text: str,
    anthropic_client,
    cache
) -> Dict[str, Any]:
    """
    Orquestrador: tenta identificação rápida -> cache -> visão
    
    Args:
        pdf_path: Caminho do PDF
        extracted_text: Texto já extraído
        anthropic_client: Cliente Anthropic
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
        cached_header = cache.get(nome, data_nasc, lab_hint)
        if cached_header:
            return cached_header
    
    # Passo 3: Usar Claude Vision (cache miss)
    print('🔍 Cache miss, usando Claude Vision...')
    header = extract_header_with_vision(pdf_path, anthropic_client)
    
    # Passo 4: Salvar no cache (se válido)
    if header.get('nome') and header.get('data_nascimento'):
        cache.put(header['nome'], header['data_nascimento'], header)
    
    return header
