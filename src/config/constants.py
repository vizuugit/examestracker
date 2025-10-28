"""
Constantes Centralizadas do Sistema HealthTrack
Todas as configurações em um único lugar
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Any

# ========================================
# AWS CONFIGURATION
# ========================================

S3_BUCKET = os.environ.get('S3_BUCKET_NAME', 'exames-app-uploads-1760032465')
TEXTRACT_REGION = os.environ.get('AWS_REGION', 'us-east-1')
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', 'exames-resultados')
CORRECTIONS_TABLE = os.environ.get('CORRECTIONS_TABLE', 'exames-training-corrections')

# Cache S3
CACHE_BUCKET = S3_BUCKET  # Usar mesmo bucket com prefixo
CACHE_PREFIX = 'header-cache/'
CACHE_TTL_DAYS = 90

# ========================================
# ANTHROPIC API
# ========================================

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
CLAUDE_HAIKU_MODEL = 'claude-3-5-haiku-20241022'

# Configuração de chamadas Claude Haiku
CLAUDE_MAX_TOKENS = 4096
CLAUDE_TEMPERATURE = 0.3

# ========================================
# GOOGLE GEMINI API
# ========================================

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
GEMINI_VISION_MODEL = 'gemini-2.0-flash-exp'
GEMINI_MAX_TOKENS = 500
GEMINI_TEMPERATURE = 0.2

# ========================================
# SUPABASE WEBHOOK
# ========================================

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://vmusmbuofkhzmtoqdhqc.supabase.co')
WEBHOOK_URL = f"{SUPABASE_URL}/functions/v1/aws-webhook"
WEBHOOK_TIMEOUT = 10
WEBHOOK_MAX_RETRIES = 3

# ========================================
# EXTRAÇÃO DE TEXTO
# ========================================

# PyPDF2
ENABLE_PYPDF2 = os.environ.get('ENABLE_PYPDF2', 'true').lower() == 'true'
PYPDF2_FALLBACK_TO_TEXTRACT = os.environ.get('PYPDF2_FALLBACK_TO_TEXTRACT', 'true').lower() == 'true'
MIN_EXTRACTED_TEXT_LENGTH = 200  # Mínimo para PyPDF2 ser considerado válido

# Textract
ENABLE_TEXTRACT = os.environ.get('ENABLE_TEXTRACT', 'true').lower() == 'true'
TEXTRACT_TIMEOUT = 30

# ========================================
# VALIDAÇÃO DE PACIENTE
# ========================================

MIN_NAME_LENGTH = 5
MAX_NAME_LENGTH = 100
MIN_NAME_WORDS = 2
MIN_WORD_LENGTH = 2
MIN_PATIENT_AGE = 0
MAX_PATIENT_AGE = 120

# Blacklist dinâmica (carregada do JSON se existir)
def _load_blacklist() -> List[str]:
    """Carrega blacklist do JSON ou usa padrão"""
    try:
        spec_path = Path(__file__).parent.parent.parent / 'especificacao_biomarcadores.json'
        if spec_path.exists():
            with open(spec_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('patient_name_blacklist', [])
    except:
        pass
    
    # Fallback para lista padrão
    return [
        'laboratorio', 'laboratório', 'lab', 'exame', 'resultado',
        'clinica', 'clínica', 'hospital', 'dr', 'dra', 'médico', 'medico',
        'unidade', 'valor', 'referencia', 'referência'
    ]

PATIENT_NAME_BLACKLIST = _load_blacklist()

# CPFs inválidos comuns
INVALID_CPFS = [
    '000.000.000-00', '111.111.111-11', '222.222.222-22',
    '333.333.333-33', '444.444.444-44', '555.555.555-55',
    '666.666.666-66', '777.777.777-77', '888.888.888-88',
    '999.999.999-99', '12345678900'
]

# ========================================
# FORMATOS DE ARQUIVO
# ========================================

IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp', '.bmp', '.tiff', '.tif']
PDF_FORMATS = ['.pdf']

# ========================================
# DEDUPLICAÇÃO DE EXAMES
# ========================================

EXAM_NAME_SIMILARITY_THRESHOLD = 0.85  # 85% de similaridade
EXAM_VALUE_TOLERANCE = 0.01  # Tolerância de 1% para valores numéricos

# ========================================
# CORREÇÕES E TREINAMENTO
# ========================================

# Campos permitidos para correção
ALLOWED_HEADER_FIELDS = [
    'paciente',
    'laboratorio',
    'data_exame',
    'data_nascimento'
]

ALLOWED_BIOMARKER_FIELDS = [
    'biomarker_name',
    'biomarker_value',
    'biomarker_unit',
    'reference_min',
    'reference_max',
    'biomarker_status'
]

ALL_ALLOWED_FIELDS = ALLOWED_HEADER_FIELDS + ALLOWED_BIOMARKER_FIELDS

# Tipos de correção
CORRECTION_TYPES = [
    'nome_virou_lab',
    'lab_virou_nome',
    'data_exame_errada',
    'data_nascimento_errada',
    'valor_biomarker_errado',
    'unidade_incorreta',
    'referencia_incorreta',
    'outro'
]

# Treinamento
MIN_CORRECTIONS_FOR_TRAINING = 50
TRAINING_S3_PREFIX = 'training-data/'
MAX_TEXT_SAMPLE_LENGTH = 5000

# ========================================
# LOGGING
# ========================================

LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
LOG_TIMESTAMPS = True

# ========================================
# LIMITES DO SISTEMA
# ========================================

MAX_PDF_SIZE_MB = 10
MAX_PAGES = 20
FUZZY_THRESHOLD = 85  # Match fuzzy de biomarcadores

# ========================================
# FUNÇÕES AUXILIARES
# ========================================

def generate_patient_name_blacklist() -> List[str]:
    """Gera blacklist expandida dinamicamente"""
    return PATIENT_NAME_BLACKLIST

def reload_blacklist() -> None:
    """Recarrega blacklist do JSON"""
    global PATIENT_NAME_BLACKLIST
    PATIENT_NAME_BLACKLIST = _load_blacklist()
    print(f"✅ Blacklist recarregada: {len(PATIENT_NAME_BLACKLIST)} termos")

def get_blacklist_stats() -> Dict[str, Any]:
    """Retorna estatísticas da blacklist"""
    return {
        'total_terms': len(PATIENT_NAME_BLACKLIST),
        'terms': PATIENT_NAME_BLACKLIST
    }
