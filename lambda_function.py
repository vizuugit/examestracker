"""
Lambda Function - Processamento de Exames Médicos
Versão otimizada com estrutura modular e suporte a HEIC
Economia estimada: 50-60% em custos de IA
"""

import os
import json
import boto3
import logging
import requests
from decimal import Decimal
from pathlib import Path
from datetime import datetime
from anthropic import Anthropic
from urllib.parse import unquote_plus
import google.generativeai as genai

# Imports do sistema modular
from src.config import *
from src.utils import (
    HeaderCacheS3,
    download_from_s3,
    cleanup_temp_files,
    calculate_exam_stats,
    validate_patient_name,
    validate_birth_date,
    BiomarkerNormalizationService
)
from src.processors import (
    extract_text_hybrid,
    extract_header_with_cache,
    parse_exams_from_text,
    clean_reference_values,
    deduplicate_exams,
    assign_biomarker_ids,
    ImageProcessor,
    is_image_supported
)
from src.services import (
    save_biomarker_corrections_batch,
    get_correction_stats,
    export_training_data
)

# Configurar logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ========================================
# CONFIGURAÇÃO DE CLIENTES AWS
# ========================================

s3_client = boto3.client('s3')
textract_client = boto3.client('textract')
dynamodb = boto3.resource('dynamodb')
anthropic_client = Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])

# Configurar Gemini para extração de headers
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_client = genai
    logger.info("✅ Gemini Flash configurado para extração de headers")
else:
    gemini_client = None
    logger.warning("⚠️ GEMINI_API_KEY não configurada - headers usarão fallback")

table = dynamodb.Table(os.environ.get('DYNAMODB_TABLE', 'exames-resultados'))
corrections_table = dynamodb.Table(os.environ.get('CORRECTIONS_TABLE', 'exames-training-corrections'))

# Cache global para headers
header_cache = HeaderCacheS3(
    bucket_name=os.environ.get('S3_BUCKET_NAME'),
    s3_client=s3_client
)

# Serviço de normalização
normalization_service = BiomarkerNormalizationService()

# ========================================
# FUNÇÕES AUXILIARES
# ========================================

def convert_floats_to_decimal(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: convert_floats_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_floats_to_decimal(item) for item in obj]
    return obj

def convert_decimals_in_dict(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: convert_decimals_in_dict(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimals_in_dict(item) for item in obj]
    return obj

def send_webhook_to_supabase(exam_id: str, s3_key: str, status: str, data: dict = None):
    """
    Envia webhook para Supabase com estrutura corrigida
    """
    webhook_url = os.environ.get('WEBHOOK_URL')
    if not webhook_url:
        logger.warning("⚠️ WEBHOOK_URL não configurada")
        return False
    
    # ✅ CORRIGIDO: Usar nomes corretos (camelCase)
    payload = {
        'examId': exam_id,           # ← Mudou de 'exam_id'
        's3Key': s3_key,             # ← Mudou de 's3_key'
        'status': 'completed',       # ← Sempre 'completed' para sucesso
        'processedAt': datetime.utcnow().isoformat() + 'Z'
    }
    
    if data:
        # ✅ Transformar estrutura AWS → estrutura brasileira esperada pelo webhook
        header = data.get('header', {})
        biomarkers = data.get('biomarkers', [])
        
        payload['data'] = {
            'dados_basicos': {
                'paciente': data.get('patient_name', 'N/A'),
                'data_exame': data.get('timestamp', ''),
                'data_nascimento': header.get('data_nascimento'),
                'laboratorio': header.get('laboratorio')
            },
            'exames': [
                {
                    'nome': b.get('biomarker_name') or b.get('nome') or b.get('exam_name', ''),
                    'resultado': str(b.get('value') or b.get('valor', '')),
                    'valor_numerico': b.get('value_numeric') or b.get('valor_numerico'),
                    'unidade': b.get('unit') or b.get('unidade'),
                    'valor_referencia_min': b.get('reference_min') or b.get('referencia_min'),
                    'valor_referencia_max': b.get('reference_max') or b.get('referencia_max'),
                    'status': b.get('status', 'normal'),
                    'categoria': b.get('category') or b.get('categoria'),
                    'percentual_desvio': b.get('deviation_percentage') or b.get('percentual_desvio'),
                    'observacao': b.get('observation') or b.get('observacao'),
                    'explicacao_leiga': b.get('layman_explanation') or b.get('explicacao_leiga'),
                    'causas_possiveis': b.get('possible_causes') or b.get('causas_possiveis'),
                    'nome_original': b.get('original_name') or b.get('nome_original'),
                    'tipo_normalizacao': b.get('normalization_type') or b.get('tipo_normalizacao'),
                    'confianca_normalizacao': b.get('normalization_confidence') or b.get('confianca_normalizacao')
                }
                for b in biomarkers
            ],
            'biomarcadores_rejeitados': [
                {
                    'nome_original': r.get('original_name') or r.get('nome_original', ''),
                    'motivo_rejeicao': r.get('rejection_reason') or r.get('motivo_rejeicao', ''),
                    'sugestoes': r.get('suggestions') or r.get('sugestoes', []),
                    'similaridade': r.get('similarity_score') or r.get('similaridade'),
                    'valor_original': r.get('original_value') or r.get('valor_original')
                }
                for r in data.get('rejected_biomarkers', [])
            ],
            'analise_clinica': {},
            'alertas': [],
            'tendencias': {},
            'recomendacoes': []
        }
        
        # Converter Decimals para floats no payload final
        payload['data'] = convert_decimals_in_dict(payload['data'])
    
    try:
        logger.info(f"📤 Sending webhook to: {webhook_url}")
        logger.info(f"📦 Payload: examId={exam_id}, status={payload['status']}, biomarkers={len(payload.get('data', {}).get('exames', []))}")
        
        response = requests.post(webhook_url, json=payload, timeout=30)
        
        logger.info(f"✅ Webhook response: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"❌ Webhook failed: {response.text}")
        
        return response.status_code == 200
        
    except Exception as e:
        logger.error(f"❌ Webhook error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

# ========================================
# FUNÇÃO PRINCIPAL DE PROCESSAMENTO
# ========================================

def process_exam_main(event: dict) -> dict:
    """
    Fluxo principal de processamento de exames
    Agora com suporte a imagens HEIC e otimização
    """
    pdf_path = None
    try:
        # 1. Parse event (S3 trigger ou API Gateway)
        if 'Records' in event:
            s3_key = unquote_plus(event['Records'][0]['s3']['object']['key'])
            exam_id = s3_key.split('/')[-1].split('.')[0]
        else:
            body = json.loads(event.get('body', '{}'))
            s3_key = body.get('s3_key')
            exam_id = body.get('exam_id')
        
        logger.info(f"🔄 Processing exam: {exam_id}")
        
        # 2. Download from S3
        pdf_path = download_from_s3(s3_client, os.environ.get('S3_BUCKET_NAME'), s3_key)
        filename = s3_key.split('/')[-1]
        
        # 3. Process HEIC images (convert to JPEG)
        if filename.lower().endswith(('.heic', '.heif')):
            logger.info(f"🔄 Converting HEIC image to JPEG: {filename}")
            try:
                with open(pdf_path, 'rb') as f:
                    heic_data = f.read()
                
                jpeg_data = ImageProcessor.convert_heic_to_jpeg(heic_data)
                
                # Save converted JPEG temporarily
                jpeg_path = pdf_path.replace('.heic', '.jpg').replace('.heif', '.jpg')
                with open(jpeg_path, 'wb') as f:
                    f.write(jpeg_data)
                
                # Update path to use JPEG
                cleanup_temp_files([pdf_path])
                pdf_path = jpeg_path
                logger.info(f"✅ HEIC converted successfully")
            except Exception as e:
                logger.error(f"❌ HEIC conversion failed: {e}")
                # Continue with original file if conversion fails
        
        # 4. Process other image files with optimization
        elif is_image_supported(filename):
            logger.info(f"🖼️ Processing image file: {filename}")
            try:
                with open(pdf_path, 'rb') as f:
                    image_data = f.read()
                
                optimized_data, quality_info = ImageProcessor.process_image(image_data, filename)
                
                # Save optimized image
                with open(pdf_path, 'wb') as f:
                    f.write(optimized_data)
                
                logger.info(f"✅ Image optimized - Quality: {quality_info['quality']} ({quality_info['score']}/100)")
            except Exception as e:
                logger.warning(f"⚠️ Image optimization failed: {e} - continuing with original")
        
        # 5. Extract text (hybrid PyPDF2 → Textract)
        extracted_text, method = extract_text_hybrid(
            pdf_path, 
            textract_client, 
            os.environ.get('S3_BUCKET_NAME'), 
            s3_key
        )
        logger.info(f"✅ Text extracted using: {method}")
        
        # 6. Extract header with cache (usando Gemini Flash)
        header_data = extract_header_with_cache(
            pdf_path, 
            extracted_text, 
            gemini_client, 
            header_cache
        )
        patient_name = header_data.get('paciente') or header_data.get('nome', 'N/A')
        logger.info(f"✅ Header extracted: {patient_name}")
        
        # 7. Parse biomarkers (Claude Haiku)
        raw_biomarkers = parse_exams_from_text(extracted_text, anthropic_client)
        cleaned = clean_reference_values(raw_biomarkers)
        deduped = deduplicate_exams(cleaned)
        final = assign_biomarker_ids(deduped)
        logger.info(f"✅ Parsed {len(final)} biomarkers")
        
        # 8. Normalize biomarkers (CORRIGIDO)
        try:
            # Construir payload no formato correto
            payload = {
                'biomarcadores': [
                    {
                        'nome': b.get('exam_name', ''),
                        'valor': b.get('value'),
                        'unidade': b.get('unit'),
                        'referencia': f"{b.get('reference_min', '')}-{b.get('reference_max', '')}" if b.get('reference_min') or b.get('reference_max') else None
                    }
                    for b in final
                ],
                'data_exame': header_data.get('data_exame')
            }
            
            # Chamar método correto - retorna ValidationResult (dataclass)
            result = normalization_service.validate_payload(payload)
            
            # Acessar atributos (não subscript) - CORRIGIDO
            normalized = result.processed_biomarkers
            rejected = result.rejected_biomarkers
            
            logger.info(f"✅ Normalized: {len(normalized)} matched, {len(rejected)} rejected")
            
        except Exception as e:
            logger.error(f"❌ Normalization failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            normalized = final
            rejected = []
        
        # 9. Save to DynamoDB (CORRIGIDO)
        exam_result = {
            'PK': exam_id,                      # ← Chave primária
            'SK': 'EXAM',                       # ← Sort key (ajustar se necessário)
            'exam_id': exam_id,
            's3_key': s3_key,
            'extracted_text': extracted_text[:5000],  # Limitar para não exceder limite DynamoDB
            'header': header_data,
            'biomarkers': normalized,
            'rejected_biomarkers': rejected,
            'stats': calculate_exam_stats(normalized),
            'timestamp': header_data.get('data_exame', ''),
            'patient_name': header_data.get('paciente', 'N/A')
        }
        
        table.put_item(Item=convert_floats_to_decimal(exam_result))
        logger.info(f"✅ Saved to DynamoDB")
        
        # 10. Webhook to Supabase (CORRIGIDO)
        webhook_success = send_webhook_to_supabase(exam_id, s3_key, 'completed', exam_result)
        
        if webhook_success:
            logger.info(f"✅ Webhook sent successfully to Supabase")
        else:
            logger.error(f"❌ Webhook failed - exam saved to DynamoDB but not synced to Supabase")
        
        # 11. Cleanup
        if pdf_path:
            cleanup_temp_files([pdf_path])
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': True, 
                'exam_id': exam_id, 
                'biomarkers': len(normalized),
                'rejected': len(rejected),
                'webhook_sent': webhook_success
            })
        }
        
    except Exception as e:
        logger.error(f"❌ Processing error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        
        if pdf_path:
            cleanup_temp_files([pdf_path])
        
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'success': False, 'error': str(e)})
        }

# ========================================
# HANDLER PRINCIPAL
# ========================================

def lambda_handler(event, context):
    """
    Handler principal com roteamento de ações
    """
    try:
        body = json.loads(event.get('body', '{}')) if 'body' in event else {}
        action = body.get('action')
        
        # Routing de ações
        if action == 'saveBiomarkerCorrections':
            return save_biomarker_corrections_batch(event, corrections_table, table)
        elif action == 'getCorrectionStats':
            return get_correction_stats(corrections_table, table)
        elif action == 'exportTrainingData':
            return export_training_data(corrections_table)
        else:
            # Fluxo principal de processamento
            return process_exam_main(event)
            
    except Exception as e:
        logger.error(f"❌ Handler error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
