"""
Utils Package
Exporta funções auxiliares, cache, validadores, helpers e normalizadores
"""

from .cache import HeaderCacheS3
from .validators import (
    is_valid_patient_name,
    validate_patient_name,
    extract_patient_name_from_text,
    extract_birth_date_from_text,
    extract_lab_name_from_text,
    validate_birth_date,
    validate_exam_data,
    normalize_exam_name,
    normalize_exam_value,
    calculate_exam_completeness,
    validate_and_deduplicate_exams,
    validate_extracted_data,
    normalize_value,
    extract_numeric_value,
    validate_value_format,
    parse_reference_range,
    validate_exam_structure,
    normalize_unit,
    calculate_exam_status,
    deduplicate_exams
)
from .helpers import (
    download_from_s3,
    cleanup_temp_files,
    format_date_brazilian,
    calculate_exam_stats
)
from .normalizer import (
    BiomarkerNormalizationService,
    BiomarkerMatch,
    RejectedBiomarker,
    DuplicateConflict,
    ValidationResult
)
from .value_validator import (
    normalizar_valor,
    validar_formato_valor
)

__all__ = [
    # Cache
    'HeaderCacheS3',
    
    # Validators
    'is_valid_patient_name',
    'validate_patient_name',
    'extract_patient_name_from_text',
    'extract_birth_date_from_text',
    'extract_lab_name_from_text',
    'validate_birth_date',
    'validate_exam_data',
    'normalize_exam_name',
    'normalize_exam_value',
    'calculate_exam_completeness',
    'validate_and_deduplicate_exams',
    'validate_extracted_data',
    'normalize_value',
    'extract_numeric_value',
    'validate_value_format',
    'parse_reference_range',
    'validate_exam_structure',
    'normalize_unit',
    'calculate_exam_status',
    'deduplicate_exams',
    
    # Helpers
    'download_from_s3',
    'cleanup_temp_files',
    'format_date_brazilian',
    'calculate_exam_stats',
    
    # Normalizer
    'BiomarkerNormalizationService',
    'BiomarkerMatch',
    'RejectedBiomarker',
    'DuplicateConflict',
    'ValidationResult',
    
    # Value Validator
    'normalizar_valor',
    'validar_formato_valor',
]
