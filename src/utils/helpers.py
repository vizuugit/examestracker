"""
Funções Auxiliares
Utilitários gerais para download, limpeza e formatação
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime


def download_from_s3(s3_client, bucket: str, key: str) -> str:
    """
    Download de arquivo do S3
    
    Args:
        s3_client: Cliente boto3 S3
        bucket: Nome do bucket
        key: Chave do objeto (ex: 'uploads/exam123.pdf')
        
    Returns:
        str: Caminho local do arquivo baixado (ex: '/tmp/exam123.pdf')
        
    Raises:
        Exception: Se o download falhar
    """
    # Extrair nome do arquivo da chave S3
    filename = key.split('/')[-1]
    local_path = f'/tmp/{filename}'
    
    try:
        s3_client.download_file(bucket, key, local_path)
        print(f'📥 Download completo: {key} -> {local_path}')
        return local_path
    except Exception as e:
        print(f'❌ Erro ao baixar {key}: {e}')
        raise Exception(f'Falha ao baixar arquivo do S3: {e}')


def cleanup_temp_files(file_paths: List[str]) -> None:
    """
    Remove arquivos temporários
    
    Args:
        file_paths: Lista de caminhos de arquivos para deletar
    """
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f'🗑️ Arquivo removido: {file_path}')
        except Exception as e:
            print(f'⚠️ Erro ao remover {file_path}: {e}')


def format_date_brazilian(date_str: str) -> str:
    """
    Garante formato de data brasileiro DD/MM/YYYY
    
    Args:
        date_str: Data em formato variado
        
    Returns:
        str: Data no formato DD/MM/YYYY
    """
    if not date_str:
        return ''
    
    # Já está no formato correto
    if re.match(r'\d{2}/\d{2}/\d{4}', date_str):
        return date_str
    
    # Tentar outros formatos comuns
    formats = ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%y']
    
    for fmt in formats:
        try:
            date_obj = datetime.strptime(date_str, fmt)
            return date_obj.strftime('%d/%m/%Y')
        except ValueError:
            continue
    
    return date_str


def calculate_exam_stats(exames: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Calcula estatísticas dos exames
    
    Args:
        exames: Lista de exames processados
        
    Returns:
        Dict com contadores de exames normais/alterados
    """
    stats = {
        'total': len(exames),
        'normal': 0,
        'alterado': 0,
        'sem_referencia': 0
    }
    
    for exam in exames:
        status = exam.get('status', '').lower()
        
        if status == 'normal':
            stats['normal'] += 1
        elif status in ['alterado', 'alto', 'baixo']:
            stats['alterado'] += 1
        else:
            stats['sem_referencia'] += 1
    
    return stats


