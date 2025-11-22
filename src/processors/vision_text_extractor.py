"""
Extração de texto de imagens usando Vision APIs
Fallback para quando PyPDF2/Textract falham ou para imagens disfarçadas
"""

import base64
from typing import Optional
from PIL import Image
import io


def extract_text_from_image_with_vision(image_path: str, gemini_client, compress: bool = False) -> Optional[str]:
    """
    Extrai texto de uma imagem usando Gemini Flash Vision
    
    Args:
        image_path: Caminho da imagem
        gemini_client: Cliente Gemini configurado
        compress: Se True, comprime imagem antes de enviar (padrão: False pois ImageProcessor já comprimiu)
        
    Returns:
        Texto extraído ou None se falhar
    """
    if not gemini_client:
        print("❌ Gemini client não configurado")
        return None
    
    try:
        # Ler imagem (já otimizada pelo ImageProcessor)
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        original_size = len(image_data)
        print(f"📸 Enviando imagem para Vision API: {original_size/1024:.1f}KB")
        
        # ⚠️ Compressão adicional APENAS se solicitado explicitamente
        # (ImageProcessor já otimizou para 1536px, quality=85)
        if compress:
            print("⚠️ Aplicando compressão adicional (normalmente desnecessário)...")
            image_data = _compress_image_for_vision(image_data)
            compressed_size = len(image_data)
            print(f"🗜️ Imagem comprimida: {original_size/1024:.1f}KB → {compressed_size/1024:.1f}KB ({100*(1-compressed_size/original_size):.0f}% menor)")
        
        # Codificar em base64
        image_b64 = base64.b64encode(image_data).decode('utf-8')
        
        # Prompt para extrair todo o texto
        prompt = """
        Extraia TODO o texto presente nesta imagem de exame médico.
        Mantenha a formatação original, incluindo:
        - Nomes de exames
        - Valores numéricos
        - Unidades de medida
        - Valores de referência
        - Datas
        - Nomes de pacientes
        
        Retorne apenas o texto extraído, sem comentários adicionais.
        """
        
        # Chamar Gemini Flash Vision
        model = gemini_client.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content([
            prompt,
            {'mime_type': 'image/jpeg', 'data': image_b64}
        ])
        
        extracted_text = response.text.strip()
        print(f"✅ Vision API: {len(extracted_text)} caracteres extraídos")
        
        return extracted_text
        
    except Exception as e:
        print(f"❌ Vision API falhou: {e}")
        return None


def _compress_image_for_vision(image_data: bytes, max_dimension: int = 1536, quality: int = 85) -> bytes:
    """
    Comprime imagem para reduzir custo do Vision API mantendo legibilidade
    
    Args:
        image_data: bytes da imagem original
        max_dimension: dimensão máxima (largura/altura) em pixels
        quality: qualidade JPEG (1-100), 85 é ótimo para OCR
        
    Returns:
        bytes: imagem comprimida
    """
    try:
        img = Image.open(io.BytesIO(image_data))
        
        # Converter para RGB se necessário
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Redimensionar se necessário (mantém aspect ratio)
        width, height = img.size
        if width > max_dimension or height > max_dimension:
            if width > height:
                new_width = max_dimension
                new_height = int(height * max_dimension / width)
            else:
                new_height = max_dimension
                new_width = int(width * max_dimension / height)
            
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            print(f"📐 Redimensionado: {width}x{height} → {new_width}x{new_height}")
        
        # Salvar como JPEG comprimido
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=quality, optimize=True)
        
        return output.getvalue()
        
    except Exception as e:
        print(f"⚠️ Falha na compressão: {e} - usando imagem original")
        return image_data
