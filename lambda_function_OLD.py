"""
Lambda Function - Processamento de Exames Médicos
Versão otimizada com estrutura modular
Economia estimada: 50-60% em custos de IA
"""

import os
import json
import boto3
import requests
from pathlib import Path
from anthropic import Anthropic

# Imports do sistema modular
from src.config import *
from src.utils import (
    HeaderCacheS3,
    download_from_s3,
    cleanup_temp_files,
    calculate_exam_stats,
    validate_patient_name,
    validate_birth_date
)
from src.processors import (
    extract_text_hybrid,
    extract_header_with_cache,
    parse_exams_from_text,
    clean_reference_values,
    deduplicate_exams,
    assign_biomarker_ids
)

# ========================================
# CONFIGURAÇÃO DE CLIENTES AWS
# ========================================

s3_client = boto3.client('s3')
textract_client = boto3.client('textract')
anthropic_client = Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])

# Cache global para headers
header_cache = HeaderCacheS3(
    bucket_name=os.environ.get('CACHE_BUCKET'),
    s3_client=s3_client
)

# ========================================
# WEBHOOK PARA SUPABASE
# ========================================

def send_webhook_to_supabase(exam_id: str, s3_key: str, status: str, data: dict = None) -> bool:
    """
    Envia resultado do processamento para Supabase via webhook
    
    Args:
        exam_id: ID do exame
        s3_key: Chave do objeto no S3
        status: 'completed' ou 'failed'
        data: Dados processados (opcional)
        
    Returns:
        bool: True se envio bem-sucedido
    """
    webhook_url = os.environ.get('WEBHOOK_URL')
    if not webhook_url:
        print('⚠️ WEBHOOK_URL não configurada')
        return False
    
    payload = {
        'examId': exam_id,
        's3Key': s3_key,
        'status': status
    }
    
    if data:
        payload.update(data)
    
    try:
        response = requests.post(
            webhook_url,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            print(f'✅ Webhook enviado: {status}')
            return True
        else:
            print(f'⚠️ Webhook retornou status {response.status_code}')
            return False
            
    except Exception as e:
        print(f'❌ Erro ao enviar webhook: {e}')
        return False


# ========================================
# FUNÇÃO PRINCIPAL DE PROCESSAMENTO
# ========================================

def process_exam_hybrid(exam_id: str, s3_bucket: str, s3_key: str) -> dict:
    """
    Processamento híbrido completo de um exame
    
    Fluxo:
    1. Download do PDF do S3
    2. Extração híbrida de texto (PyPDF2 -> Textract)
    3. Extração de header com cache (Vision apenas se necessário)
    4. Parsing de exames com Claude Haiku
    5. Limpeza e deduplicação
    6. Montagem do payload final
    
    Args:
        exam_id: ID único do exame
        s3_bucket: Nome do bucket S3
        s3_key: Chave do objeto no S3
        
    Returns:
        dict: Payload completo para o webhook
    """
    temp_files = []
    
    try:
        # Passo 1: Download do PDF
        print(f'\n📥 Processando exame: {exam_id}')
        local_pdf = f'/tmp/{exam_id}.pdf'
        temp_files.append(local_pdf)
        
        if not download_from_s3(s3_client, s3_bucket, s3_key, local_pdf):
            raise Exception('Falha ao baixar PDF do S3')
        
        # Passo 2: Extração híbrida de texto
        print('\n📄 Extraindo texto...')
        extracted_text, extraction_method = extract_text_hybrid(
            local_pdf, 
            textract_client, 
            s3_bucket, 
            s3_key
        )
        
        if not extracted_text:
            raise Exception('Falha na extração de texto')
        
        print(f'   Método usado: {extraction_method}')
        print(f'   Caracteres extraídos: {len(extracted_text)}')
        
        # Passo 3: Extração de header com cache
        print('\n👤 Extraindo header do paciente...')
        header = extract_header_with_cache(
            local_pdf,
            extracted_text,
            anthropic_client,
            header_cache
        )
        
        # Validar header
        nome = header.get('nome', '')
        data_nasc = header.get('data_nascimento', '')
        
        if not validate_patient_name(nome):
            print(f'⚠️ Nome inválido: {nome}')
        
        if not validate_birth_date(data_nasc):
            print(f'⚠️ Data de nascimento inválida: {data_nasc}')
        
        # Passo 4: Parsing de exames
        print('\n🧪 Parseando exames...')
        exames = parse_exams_from_text(extracted_text, anthropic_client)
        
        if not exames:
            print('⚠️ Nenhum exame encontrado')
        
        # Passo 5: Limpeza e deduplicação
        print('\n🔧 Limpando e deduplicando...')
        exames = clean_reference_values(exames)
        exames = deduplicate_exams(exames)
        exames = assign_biomarker_ids(exames)
        
        # Passo 6: Estatísticas
        stats = calculate_exam_stats(exames)
        print(f'\n📊 Estatísticas:')
        print(f'   Total: {stats["total"]} exames')
        print(f'   Normal: {stats["normal"]}')
        print(f'   Alterado: {stats["alterado"]}')
        
        # Passo 7: Montar payload final
        payload = {
            'header': header,
            'exams': exames,
            'stats': stats,
            'metadata': {
                'extraction_method': extraction_method,
                'text_length': len(extracted_text),
                'cache_used': header_cache.enabled
            }
        }
        
        return payload
        
    finally:
        # Sempre limpar arquivos temporários
        cleanup_temp_files(temp_files)


# ========================================
# LAMBDA HANDLER (ENTRY POINT)
# ========================================

def lambda_handler(event, context):
    """
    Entry point da Lambda
    
    Event esperado:
    {
        "examId": "uuid",
        "s3Bucket": "bucket-name",
        "s3Key": "path/to/file.pdf"
    }
    """
    print('=' * 60)
    print('🚀 Lambda Function Iniciada')
    print('=' * 60)
    
    try:
        # Parse do evento
        exam_id = event.get('examId')
        s3_bucket = event.get('s3Bucket')
        s3_key = event.get('s3Key')
        
        if not all([exam_id, s3_bucket, s3_key]):
            raise ValueError('Parâmetros obrigatórios faltando: examId, s3Bucket, s3Key')
        
        print(f'\n📋 Parâmetros:')
        print(f'   Exam ID: {exam_id}')
        print(f'   Bucket: {s3_bucket}')
        print(f'   Key: {s3_key}')
        
        # Processar exame
        result = process_exam_hybrid(exam_id, s3_bucket, s3_key)
        
        # Enviar webhook de sucesso
        send_webhook_to_supabase(
            exam_id=exam_id,
            s3_key=s3_key,
            status='completed',
            data=result
        )
        
        print('\n✅ Processamento concluído com sucesso!')
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Exame processado com sucesso',
                'examId': exam_id,
                'stats': result.get('stats')
            })
        }
        
    except Exception as e:
        print(f'\n❌ Erro no processamento: {e}')
        import traceback
        traceback.print_exc()
        
        # Enviar webhook de falha
        try:
            send_webhook_to_supabase(
                exam_id=event.get('examId'),
                s3_key=event.get('s3Key'),
                status='failed',
                data={'error': str(e)}
            )
        except:
            pass
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Erro no processamento',
                'error': str(e)
            })
        }
