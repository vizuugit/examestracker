"""
Lambda Function - Processamento de Exames Médicos
Versão otimizada com Gemini AI - 100% Gemini (mais barato)
Economia estimada: 70-80% em custos de IA
"""

import os
import json
import boto3
import logging
import requests
from decimal import Decimal
from pathlib import Path
from datetime import datetime
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
    extract_text_universal,
    extract_text_from_image_with_vision,
    extract_header_with_cache,
    parse_lab_report_with_gemini,
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

# Configurar Gemini (100% do sistema agora usa Gemini)
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_client = genai
    logger.info("✅ Gemini Flash configurado para headers E parsing de biomarcadores")
else:
    gemini_client = None
    logger.error("❌ GEMINI_API_KEY não configurada - sistema não funcionará!")
    raise Exception("GEMINI_API_KEY is required")

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

def get_exam_uuid_from_supabase(filename: str) -> str:
    """
    Busca o UUID do exame no Supabase usando o filename
    Retorna o UUID se encontrado, caso contrário retorna o filename (fallback)
    """
    supabase_url = os.environ.get('SUPABASE_URL', 'https://vmusmbuofkhzmtoqdhqc.supabase.co')
    supabase_key = os.environ.get('SUPABASE_KEY')
    
    if not supabase_key:
        logger.warning('⚠️ SUPABASE_KEY não configurada, usando filename como fallback')
        return filename
    
    try:
        logger.info(f'🔍 Buscando UUID do exame com filename: {filename}')
        
        response = requests.get(
            f"{supabase_url}/rest/v1/exams?aws_file_name=eq.{filename}&select=id&limit=1",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json"
            },
            timeout=10
        )
        
        if response.status_code != 200:
            logger.error(f'❌ Erro ao buscar UUID: {response.status_code}')
            return filename
        
        exam_data = response.json()
        if not exam_data or len(exam_data) == 0:
            logger.error(f'❌ Nenhum exame encontrado com filename: {filename}')
            return filename
        
        exam_uuid = exam_data[0]['id']
        logger.info(f'✅ UUID encontrado: {exam_uuid}')
        return exam_uuid
        
    except Exception as e:
        logger.error(f'❌ Erro ao buscar UUID: {e}')
        return filename

def send_webhook_to_supabase(exam_id: str, s3_key: str, status: str, data: dict = None, filename: str = None):
    """
    Envia webhook para Supabase com estrutura corrigida
    """
    webhook_url = os.environ.get('WEBHOOK_URL')
    if not webhook_url:
        logger.warning("⚠️ WEBHOOK_URL não configurada")
        return False
    
    # ✅ CORRIGIDO: Usar nomes corretos (camelCase)
    payload = {
        'examId': exam_id,           # ← UUID do exame
        's3Key': s3_key,             # ← Chave S3
        'filename': filename,         # ← Nome do arquivo original
        'status': status,             # ← Status (completed/failed)
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
    temp_files = []
    
    try:
        # 1. Parse event (S3 trigger ou API Gateway)
        if 'Records' in event:
            s3_key = unquote_plus(event['Records'][0]['s3']['object']['key'])
            filename = s3_key.split('/')[-1]
            logger.info(f'📂 S3 Key: {s3_key}')
            logger.info(f'📄 Filename extraído: {filename}')
            # ✅ Buscar UUID real do exame no Supabase
            exam_id = get_exam_uuid_from_supabase(filename)
        else:
            body = json.loads(event.get('body', '{}'))
            s3_key = body.get('s3_key')
            exam_id = body.get('exam_id')
            filename = s3_key.split('/')[-1] if s3_key else 'unknown'
        
        logger.info(f"🔄 Processing file: {filename}")
        logger.info(f"🆔 Exam UUID: {exam_id}")
        
        # 2. Download from S3
        pdf_path = download_from_s3(s3_client, os.environ.get('S3_BUCKET_NAME'), s3_key)
        temp_files.append(pdf_path)
        
        # Log informações do arquivo
        file_size = os.path.getsize(pdf_path)
        logger.info(f"📥 Arquivo baixado: {filename} ({file_size} bytes)")
        
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
                pdf_path = jpeg_path
                temp_files.append(jpeg_path)
                logger.info(f"✅ HEIC converted successfully")
            except Exception as e:
                logger.error(f"❌ HEIC conversion failed: {e}")
                # Continue with original file if conversion fails
        
        # 4. Process other image files with optimization (já no formato ideal para Vision)
        elif is_image_supported(filename):
            logger.info(f"🖼️ Processing image file: {filename}")
            try:
                with open(pdf_path, 'rb') as f:
                    image_data = f.read()
                
                # Otimizar para Vision (1536px, quality=85) - formato ideal para OCR
                optimized_data, quality_info = ImageProcessor.process_image(
                    image_data, 
                    filename, 
                    optimize_for='vision'
                )
                
                # Save optimized image
                with open(pdf_path, 'wb') as f:
                    f.write(optimized_data)
                
                logger.info(f"✅ Image optimized for Vision - Quality: {quality_info['quality']} ({quality_info['score']}/100)")
            except Exception as e:
                logger.warning(f"⚠️ Image optimization failed: {e} - continuing with original")
        
        # 5. Extract text (universal: suporta PDF, Word, imagens)
        extracted_text, method = extract_text_universal(
            pdf_path, 
            textract_client, 
            os.environ.get('S3_BUCKET_NAME'), 
            s3_key
        )
        logger.info(f"✅ Text extracted using: {method}")
        
        # 6. FALLBACK PARA VISION API
        if not extracted_text or method in ['none', 'image_needs_vision']:
            logger.warning(f"⚠️ Extração primária falhou ou requer Vision - tentando fallbacks...")
            
            file_ext = filename.lower().split('.')[-1]
            
            # Fallback 1: Se for imagem, tentar Vision API direto (sem compressão, já foi otimizada)
            if is_image_supported(filename):
                logger.info(f"🖼️ Extraindo texto de imagem via Vision API...")
                # compress=False porque ImageProcessor já otimizou para 1536px, quality=85
                extracted_text = extract_text_from_image_with_vision(pdf_path, gemini_client, compress=False)
                if extracted_text:
                    method = 'gemini-vision'
                    logger.info(f"✅ Vision API: {len(extracted_text)} caracteres extraídos")
            
            # Fallback 2: Se for PDF, converter TODAS as páginas para imagem e tentar Vision API
            elif file_ext == 'pdf' and gemini_client:
                logger.info(f"📄 Convertendo PDF para imagens e tentando Vision API...")
                try:
                    import fitz  # PyMuPDF
                    
                    doc = fitz.open(pdf_path)
                    total_pages = len(doc)
                    
                    if total_pages > 0:
                        logger.info(f'📄 PDF tem {total_pages} páginas - processando todas...')
                        
                        all_extracted_text = []
                        
                        # Iterar sobre TODAS as páginas
                        for page_num in range(total_pages):
                            logger.info(f'📄 Processando página {page_num + 1}/{total_pages}...')
                            
                            try:
                                # Converter página para imagem (1.5x resolution = balanço perfeito OCR/tamanho)
                                page = doc[page_num]
                                pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
                                
                                # Salvar como JPEG com compressão via PIL (controle de qualidade)
                                image_path = pdf_path.replace('.pdf', f'_page{page_num + 1}.jpg')
                                
                                # Obter bytes e comprimir via PIL
                                from PIL import Image
                                import io
                                
                                img_bytes = pix.tobytes("jpeg")
                                img = Image.open(io.BytesIO(img_bytes))
                                img.save(image_path, format='JPEG', quality=85, optimize=True)
                                
                                temp_files.append(image_path)
                                logger.info(f'✅ Página {page_num + 1} convertida: {image_path}')
                                
                                # Extrair texto com Vision API (já comprime internamente)
                                page_text = extract_text_from_image_with_vision(image_path, gemini_client)
                                
                                if page_text:
                                    all_extracted_text.append(page_text)
                                    logger.info(f'✅ Página {page_num + 1}: {len(page_text)} caracteres extraídos')
                                else:
                                    logger.warning(f'⚠️ Página {page_num + 1}: nenhum texto extraído')
                            
                            except Exception as page_error:
                                logger.error(f'❌ Erro na página {page_num + 1}: {page_error}')
                                continue
                        
                        doc.close()
                        
                        # Juntar texto de todas as páginas
                        if all_extracted_text:
                            extracted_text = '\n\n=== NOVA PÁGINA ===\n\n'.join(all_extracted_text)
                            method = 'gemini-vision-from-pdf-multipage'
                            logger.info(f'✅ Vision API extraiu {len(extracted_text)} caracteres de {len(all_extracted_text)} páginas')
                        else:
                            logger.error('❌ Nenhuma página teve texto extraído com sucesso')
                    else:
                        logger.error('❌ PDF não tem páginas')
                    
                except Exception as e:
                    logger.error(f'❌ Falha ao converter PDF para imagens: {e}')
                    import traceback
                    logger.error(traceback.format_exc())
            
            # Validação final
            if not extracted_text:
                supported_formats = ['PDF', 'DOCX', 'DOC', 'JPG', 'PNG', 'HEIC']
                raise ValueError(
                    f"Não foi possível extrair texto do arquivo '{filename}'. "
                    f"Formatos suportados: {', '.join(supported_formats)}. "
                    f"Método tentado: {method}"
                )
        
        # 7. Extract header with cache (usando Gemini Flash)
        header_data = extract_header_with_cache(
            pdf_path, 
            extracted_text, 
            gemini_client, 
            header_cache
        )
        extracted_name = header_data.get('paciente') or header_data.get('nome', 'N/A')
        extracted_birth_date = header_data.get('data_nascimento')
        extracted_lab = header_data.get('laboratorio')
        exam_date = header_data.get('data_exame')
        
        logger.info(f"✅ Header extracted: {extracted_name}")

        # 8. Parse biomarkers (Gemini 2.0 Flash - 70-80% mais barato que Claude)
        result = parse_lab_report_with_gemini(
            extracted_text=extracted_text,
            gemini_model=GEMINI_VISION_MODEL,
            normalization_service=normalization_service,
            extracted_name=extracted_name,
            extracted_birth_date=extracted_birth_date,
            extracted_lab=extracted_lab
        )

        # Atualizar campos do header com dados validados do Gemini
        if result.get('nome'):
            extracted_name = result['nome']
        if result.get('data_nascimento'):
            extracted_birth_date = result['data_nascimento']
        if result.get('laboratorio'):
            extracted_lab = result['laboratorio']
        if result.get('data_exame'):
            exam_date = result['data_exame']
        
        # Exames já vêm processados, normalizados e deduplicados
        final = result.get('exams', [])
        logger.info(f"✅ Parsed {len(final)} biomarkers (v5.0 integrated)")
        
        # ✅ CAMADA 2: FALLBACK COM REGEX para valores vazios
        import re
        
        for exam in final:
            # Se Claude não extraiu valor, tentar regex
            if not exam.get('value') or str(exam.get('value')).strip() == '':
                exam_name = exam.get('exam_name', '')
                logger.warning(f"⚠️ Claude não extraiu valor para: {exam_name}")
                
                # Padrões de busca (ordem de prioridade)
                patterns = [
                    # Padrão 1: Tabela vertical - "Resultado | 38,0 mm/h"
                    (rf"{re.escape(exam_name)}.*?Resultado.*?(\d+[,.]?\d*)\s*([a-zA-Z/%µ]+)", "vertical"),
                    
                    # Padrão 2: Linha horizontal - "VHS: 38,0 mm/h"
                    (rf"{re.escape(exam_name)}\s*[:\|]\s*(\d+[,.]?\d*)\s*([a-zA-Z/%µ]+)", "horizontal"),
                    
                    # Padrão 3: Operadores - "Inferior a 8 UI/mL"
                    (rf"{re.escape(exam_name)}.*?(Inferior|Superior)\s+a\s+(\d+[,.]?\d*)\s*([a-zA-Z/%µ]+)?", "operator"),
                ]
                
                for pattern, pattern_type in patterns:
                    match = re.search(pattern, extracted_text, re.IGNORECASE | re.DOTALL)
                    if match:
                        groups = match.groups()
                        
                        # Padrão 3 (operador)
                        if pattern_type == "operator" and groups[0]:
                            operator = "<" if "inferior" in groups[0].lower() else ">"
                            exam['value'] = f"{operator} {groups[1].replace(',', '.')}"
                            exam['unit'] = groups[2] if len(groups) > 2 and groups[2] else exam.get('unit')
                            logger.info(f"✅ Regex extraiu (operador): {exam_name} = {exam['value']}")
                            break
                        
                        # Padrões 1 e 2 (valor numérico)
                        else:
                            exam['value'] = groups[0].replace(',', '.')
                            exam['unit'] = groups[1] if len(groups) > 1 else exam.get('unit')
                            logger.info(f"✅ Regex extraiu ({pattern_type}): {exam_name} = {exam['value']} {exam['unit']}")
                            break
        
        # 9. Separar rejeitados (já processado no parse_lab_report)
        normalized = final
        rejected = []
        
        # 10. Save to DynamoDB
        exam_result = {
            'PK': exam_id,
            'SK': 'EXAM',
            'exam_id': exam_id,
            's3_key': s3_key,
            'extracted_text': extracted_text[:5000],
            'header': {
                'paciente': extracted_name,
                'data_nascimento': extracted_birth_date,
                'laboratorio': extracted_lab,
                'data_exame': exam_date
            },
            'biomarkers': normalized,
            'rejected_biomarkers': rejected,
            'stats': calculate_exam_stats(normalized),
            'timestamp': exam_date or '',
            'patient_name': extracted_name
        }
        
        # ✅ CAMADA 3: VALIDAÇÃO PRÉ-DYNAMODB - Logging detalhado
        empty_values = [e for e in normalized if not e.get('value') or str(e.get('value')).strip() == '']
        if empty_values:
            logger.error(f"❌ {len(empty_values)}/{len(normalized)} biomarcadores SEM VALOR:")
            for e in empty_values[:10]:  # Mostrar até 10
                logger.error(f"  - {e.get('exam_name') or e.get('nome', 'UNKNOWN')} (original: {e.get('nome_original', 'N/A')})")
            
            # Estatísticas de falha
            logger.warning(f"📊 Taxa de extração: {((len(normalized) - len(empty_values)) / len(normalized) * 100):.1f}% ({len(normalized) - len(empty_values)}/{len(normalized)})")
        else:
            logger.info(f"✅ 100% dos biomarcadores com valores extraídos ({len(normalized)})")
        
        table.put_item(Item=convert_floats_to_decimal(exam_result))
        logger.info(f"✅ Saved to DynamoDB")
        
        # 11. Webhook to Supabase
        webhook_success = send_webhook_to_supabase(exam_id, s3_key, 'completed', exam_result, filename)
        
        if webhook_success:
            logger.info(f"✅ Webhook sent successfully to Supabase")
        else:
            logger.error(f"❌ Webhook failed - exam saved to DynamoDB but not synced to Supabase")
        
        # 12. Cleanup
        cleanup_temp_files(temp_files)
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': True, 
                'exam_id': exam_id, 
                'biomarkers': len(normalized),
                'rejected': len(rejected),
                'webhook_sent': webhook_success,
                'extraction_method': method
            })
        }
        
    except Exception as e:
        logger.error(f"❌ Processing error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        
        # Enviar webhook de erro com detalhes
        error_details = {
            'error_type': type(e).__name__,
            'error_message': str(e),
            'extraction_method': method if 'method' in locals() else 'unknown',
            'file_name': filename if 'filename' in locals() else 'unknown'
        }
        
        if 'exam_id' in locals() and 's3_key' in locals():
            send_webhook_to_supabase(
                exam_id, 
                s3_key, 
                'failed',
                {'error': error_details},
                filename if 'filename' in locals() else None
            )
        
        cleanup_temp_files(temp_files)
        
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': False, 
                'error': str(e),
                'details': error_details
            })
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
