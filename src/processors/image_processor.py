"""
Image Processor - Multi-Format Support
Otimiza e processa imagens para melhor OCR
Suporta: JPG, PNG, HEIC, TIFF, WebP
"""

import io
import logging
from PIL import Image, ImageEnhance, ImageFilter

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Configurações de otimização
MAX_DIMENSION_TEXTRACT = 4096  # Textract limit
MAX_DIMENSION_VISION = 1536  # Vision API optimal (melhor custo/qualidade)
JPEG_QUALITY = 85  # Ideal para OCR (Vision + Textract)
TARGET_DPI = 300


class ImageProcessor:
    """Processa e otimiza imagens para OCR"""

    @staticmethod
    def is_supported_format(filename):
        """Verifica se o formato é suportado"""
        supported = ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.tiff', '.tif', '.webp']
        return any(filename.lower().endswith(ext) for ext in supported)

    @staticmethod
    def get_format_info(filename):
        """Retorna informações sobre o formato"""
        filename_lower = filename.lower()
        
        if filename_lower.endswith('.pdf'):
            return {
                'type': 'pdf',
                'method': 'async',
                'content_type': 'application/pdf'
            }
        elif any(filename_lower.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.tiff', '.tif', '.webp']):
            return {
                'type': 'image',
                'method': 'sync',
                'content_type': 'image/jpeg'
            }
        else:
            return None

    @staticmethod
    def process_image(image_data, filename, optimize_for='vision'):
        """
        Processa e otimiza imagem para melhor OCR
        
        Args:
            image_data: bytes da imagem
            filename: nome do arquivo para detectar formato
            optimize_for: 'vision' (1536px, quality=85) ou 'textract' (4096px, quality=85)
            
        Returns:
            tuple: (optimized_bytes, quality_info)
        """
        try:
            # Abrir imagem
            img = Image.open(io.BytesIO(image_data))
            
            # Converter HEIC/RGBA para RGB
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Coletar info de qualidade antes das otimizações
            quality_info = ImageProcessor._analyze_quality(img)
            
            # Aplicar otimizações com target correto
            max_dim = MAX_DIMENSION_VISION if optimize_for == 'vision' else MAX_DIMENSION_TEXTRACT
            img = ImageProcessor._apply_optimizations(img, max_dimension=max_dim)
            
            # Converter para bytes otimizados
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=JPEG_QUALITY, optimize=True)
            optimized_bytes = output.getvalue()
            
            logger.info(f"✅ Image optimized for {optimize_for}: {len(image_data)} -> {len(optimized_bytes)} bytes")
            logger.info(f"📐 Max dimension: {max_dim}px, Quality: {JPEG_QUALITY}")
            logger.info(f"📊 Quality score: {quality_info['score']}/100")
            
            return optimized_bytes, quality_info
            
        except Exception as e:
            logger.error(f"❌ Error processing image: {str(e)}")
            # Retornar imagem original se falhar
            return image_data, {'score': 0, 'issues': ['processing_failed']}

    @staticmethod
    def _apply_optimizations(img, max_dimension=MAX_DIMENSION_VISION):
        """Aplica otimizações na imagem"""
        try:
            # 1. Auto-rotation baseado em EXIF
            try:
                import PIL.ExifTags
                exif = img._getexif()
                if exif:
                    for tag, value in exif.items():
                        if tag in PIL.ExifTags.TAGS and PIL.ExifTags.TAGS[tag] == 'Orientation':
                            if value == 3:
                                img = img.rotate(180, expand=True)
                            elif value == 6:
                                img = img.rotate(270, expand=True)
                            elif value == 8:
                                img = img.rotate(90, expand=True)
            except:
                pass
            
            # 2. Resize se necessário (manter proporção)
            width, height = img.size
            if width > max_dimension or height > max_dimension:
                ratio = min(max_dimension/width, max_dimension/height)
                new_size = (int(width * ratio), int(height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
                logger.info(f"📐 Resized: {width}x{height} -> {new_size[0]}x{new_size[1]}")
            
            # 3. Melhorar contraste (sutilmente)
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.2)
            
            # 4. Melhorar nitidez (para texto)
            enhancer = ImageEnhance.Sharpness(img)
            img = enhancer.enhance(1.3)
            
            # 5. Redução de ruído suave
            img = img.filter(ImageFilter.MedianFilter(size=3))
            
            return img
            
        except Exception as e:
            logger.warning(f"⚠️ Optimization failed: {str(e)}")
            return img

    @staticmethod
    def _analyze_quality(img):
        """
        Analisa qualidade da imagem
        Retorna score 0-100 e lista de issues
        """
        issues = []
        score = 100
        suggestions = []
        width, height = img.size
        
        # 1. Resolução
        if width < 800 or height < 800:
            issues.append('low_resolution')
            suggestions.append('Tente tirar foto com resolução maior')
            score -= 20
        
        # 2. Tamanho excessivo
        if width > 4000 or height > 4000:
            issues.append('very_high_resolution')
            suggestions.append('Imagem será redimensionada automaticamente')
            score -= 5
        
        # 3. Análise de brilho
        try:
            import numpy as np
            img_array = np.array(img.convert('L'))
            brightness = np.mean(img_array)
            
            if brightness < 50:
                issues.append('too_dark')
                suggestions.append('Tente tirar foto com mais luz')
                score -= 25
            elif brightness > 200:
                issues.append('too_bright')
                suggestions.append('Reduza a iluminação ou evite flash direto')
                score -= 15
        except ImportError:
            pass
        
        # 4. Análise de contraste
        try:
            import numpy as np
            img_array = np.array(img.convert('L'))
            contrast = np.std(img_array)
            
            if contrast < 30:
                issues.append('low_contrast')
                suggestions.append('Documento pode estar desbotado')
                score -= 20
        except ImportError:
            pass
        
        # 5. Detecção de blur (se OpenCV disponível)
        try:
            import cv2
            import numpy as np
            img_array = np.array(img.convert('L'))
            laplacian_var = cv2.Laplacian(img_array, cv2.CV_64F).var()
            
            if laplacian_var < 100:
                issues.append('blurry')
                suggestions.append('Imagem está desfocada - tente foto mais nítida')
                score -= 30
        except ImportError:
            logger.info('📋 OpenCV not available - skipping blur detection')
        except Exception as e:
            logger.warning(f'⚠️ Blur detection failed: {str(e)}')
        
        # Garantir score entre 0-100
        score = max(0, min(100, score))
        
        # Qualidade textual
        if score >= 80:
            quality = 'excellent'
        elif score >= 60:
            quality = 'good'
        elif score >= 40:
            quality = 'fair'
        else:
            quality = 'poor'
        
        return {
            'score': score,
            'quality': quality,
            'resolution': f"{width}x{height}",
            'issues': issues,
            'suggestions': suggestions
        }

    @staticmethod
    def convert_heic_to_jpeg(heic_data):
        """Converte HEIC (iPhone) para JPEG"""
        try:
            # pillow-heif é necessário para HEIC
            import pillow_heif
            pillow_heif.register_heif_opener()
            
            img = Image.open(io.BytesIO(heic_data))
            
            # Converter para RGB se necessário
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Salvar como JPEG
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=JPEG_QUALITY)
            
            logger.info('✅ HEIC converted to JPEG')
            return output.getvalue()
            
        except ImportError:
            logger.error('❌ pillow-heif not installed - cannot convert HEIC')
            raise Exception('HEIC format requires pillow-heif library')
        except Exception as e:
            logger.error(f'❌ HEIC conversion failed: {str(e)}')
            raise


# Funções auxiliares para uso direto
def process_image_file(image_bytes, filename, optimize_for='vision'):
    """Helper function para processar arquivo de imagem"""
    processor = ImageProcessor()
    return processor.process_image(image_bytes, filename, optimize_for=optimize_for)


def is_image_supported(filename):
    """Helper function para verificar suporte"""
    return ImageProcessor.is_supported_format(filename)


def get_file_format_info(filename):
    """Helper function para info de formato"""
    return ImageProcessor.get_format_info(filename)
