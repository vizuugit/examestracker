"""
Services Package
Exporta serviços de alto nível (correções, treinamento)
"""

from .corrections_service import (
    save_biomarker_correction,
    save_biomarker_corrections_batch,
    update_biomarker_with_correction,
    get_extracted_text_from_exam,
    detect_correction_type
)

from .training_export import (
    export_training_data,
    get_correction_stats
)

__all__ = [
    # Correções
    'save_biomarker_correction',
    'save_biomarker_corrections_batch',
    'update_biomarker_with_correction',
    'get_extracted_text_from_exam',
    'detect_correction_type',
    
    # Treinamento
    'export_training_data',
    'get_correction_stats',
]
