"""
Config Package
Exporta todas as configurações e constantes do sistema
"""

from .constants import (
    # AWS
    S3_BUCKET,
    TEXTRACT_REGION,
    DYNAMODB_TABLE,
    CORRECTIONS_TABLE,
    CACHE_BUCKET,
    CACHE_PREFIX,
    CACHE_TTL_DAYS,
    
    # Anthropic
    ANTHROPIC_API_KEY,
    CLAUDE_HAIKU_MODEL,
    CLAUDE_VISION_MODEL,
    CLAUDE_MODEL,
    CLAUDE_MAX_TOKENS,
    CLAUDE_TEMPERATURE,
    
    # Supabase
    SUPABASE_URL,
    WEBHOOK_URL,
    WEBHOOK_TIMEOUT,
    WEBHOOK_MAX_RETRIES,
    
    # Extração
    ENABLE_PYPDF2,
    ENABLE_TEXTRACT,
    PYPDF2_FALLBACK_TO_TEXTRACT,
    MIN_EXTRACTED_TEXT_LENGTH,
    TEXTRACT_TIMEOUT,
    
    # Validação
    MIN_NAME_LENGTH,
    MAX_NAME_LENGTH,
    MIN_NAME_WORDS,
    MIN_WORD_LENGTH,
    PATIENT_NAME_BLACKLIST,
    MIN_PATIENT_AGE,
    MAX_PATIENT_AGE,
    INVALID_CPFS,
    
    # Formatos
    IMAGE_FORMATS,
    PDF_FORMATS,
    
    # Deduplicação
    EXAM_NAME_SIMILARITY_THRESHOLD,
    EXAM_VALUE_TOLERANCE,
    
    # Correções
    ALLOWED_HEADER_FIELDS,
    ALLOWED_BIOMARKER_FIELDS,
    ALL_ALLOWED_FIELDS,
    CORRECTION_TYPES,
    MIN_CORRECTIONS_FOR_TRAINING,
    TRAINING_S3_PREFIX,
    MAX_TEXT_SAMPLE_LENGTH,
    
    # Sistema
    LOG_LEVEL,
    LOG_TIMESTAMPS,
    MAX_PDF_SIZE_MB,
    MAX_PAGES,
    FUZZY_THRESHOLD,
    
    # Funções
    generate_patient_name_blacklist,
    reload_blacklist,
    get_blacklist_stats
)

__all__ = [
    # AWS
    'S3_BUCKET',
    'TEXTRACT_REGION',
    'DYNAMODB_TABLE',
    'CORRECTIONS_TABLE',
    'CACHE_BUCKET',
    'CACHE_PREFIX',
    'CACHE_TTL_DAYS',
    
    # Anthropic
    'ANTHROPIC_API_KEY',
    'CLAUDE_HAIKU_MODEL',
    'CLAUDE_VISION_MODEL',
    'CLAUDE_MODEL',
    'CLAUDE_MAX_TOKENS',
    'CLAUDE_TEMPERATURE',
    
    # Supabase
    'SUPABASE_URL',
    'WEBHOOK_URL',
    'WEBHOOK_TIMEOUT',
    'WEBHOOK_MAX_RETRIES',
    
    # Extração
    'ENABLE_PYPDF2',
    'ENABLE_TEXTRACT',
    'PYPDF2_FALLBACK_TO_TEXTRACT',
    'MIN_EXTRACTED_TEXT_LENGTH',
    'TEXTRACT_TIMEOUT',
    
    # Validação
    'MIN_NAME_LENGTH',
    'MAX_NAME_LENGTH',
    'MIN_NAME_WORDS',
    'MIN_WORD_LENGTH',
    'PATIENT_NAME_BLACKLIST',
    'MIN_PATIENT_AGE',
    'MAX_PATIENT_AGE',
    'INVALID_CPFS',
    
    # Formatos
    'IMAGE_FORMATS',
    'PDF_FORMATS',
    
    # Deduplicação
    'EXAM_NAME_SIMILARITY_THRESHOLD',
    'EXAM_VALUE_TOLERANCE',
    
    # Correções
    'ALLOWED_HEADER_FIELDS',
    'ALLOWED_BIOMARKER_FIELDS',
    'ALL_ALLOWED_FIELDS',
    'CORRECTION_TYPES',
    'MIN_CORRECTIONS_FOR_TRAINING',
    'TRAINING_S3_PREFIX',
    'MAX_TEXT_SAMPLE_LENGTH',
    
    # Sistema
    'LOG_LEVEL',
    'LOG_TIMESTAMPS',
    'MAX_PDF_SIZE_MB',
    'MAX_PAGES',
    'FUZZY_THRESHOLD',
    
    # Funções
    'generate_patient_name_blacklist',
    'reload_blacklist',
    'get_blacklist_stats'
]
