"""
Processors Package
Exporta funções de processamento de texto, headers, exames e imagens
"""

from .text_extractor import (
    extract_text_with_pypdf2,
    extract_text_with_textract,
    extract_text_from_docx,
    extract_text_hybrid,
    extract_text_universal
)

from .vision_text_extractor import (
    extract_text_from_image_with_vision
)

from .header_processor import (
    extract_patient_identifiers_from_text,
    extract_lab_hint_from_text,
    extract_header_with_vision,
    extract_header_with_cache
)

from .exam_parser import (
    parse_lab_report,
    parse_lab_report_with_gemini,
    process_exam,
    validate_parsed_result,
    get_parsing_stats
)

from .image_processor import (
    ImageProcessor,
    process_image_file,
    is_image_supported,
    get_file_format_info
)

__all__ = [
    # Text extraction
    'extract_text_with_pypdf2',
    'extract_text_with_textract',
    'extract_text_from_docx',
    'extract_text_hybrid',
    'extract_text_universal',
    'extract_text_from_image_with_vision',
    
    # Header processing
    'extract_patient_identifiers_from_text',
    'extract_lab_hint_from_text',
    'extract_header_with_vision',
    'extract_header_with_cache',
    
    # Exam parsing
    'parse_lab_report',
    'parse_lab_report_with_gemini',
    'process_exam',
    'validate_parsed_result',
    'get_parsing_stats',
    
    # Image processing
    'ImageProcessor',
    'process_image_file',
    'is_image_supported',
    'get_file_format_info'
]
