"""
Training Export Service - Export de Dados para Treinamento
Gera datasets para fine-tuning de modelos (Claude, GPT, etc)
"""

import json
import logging
from datetime import datetime
from typing import Dict, Any, List
from collections import Counter

from src.config import (
    MIN_CORRECTIONS_FOR_TRAINING,
    MAX_TEXT_SAMPLE_LENGTH,
    ALLOWED_HEADER_FIELDS,
    ALLOWED_BIOMARKER_FIELDS
)

logger = logging.getLogger(__name__)


def export_training_data(corrections_table) -> Dict[str, Any]:
    """
    Exporta correções para formato de treinamento
    
    Args:
        corrections_table: Tabela DynamoDB de correções
        
    Returns:
        Response dict com dados de treinamento
    """
    try:
        logger.info("📦 Iniciando export de dados de treinamento")
        
        # Scan completo da tabela (cuidado em produção!)
        response = corrections_table.scan()
        corrections = response.get('Items', [])
        
        if len(corrections) < MIN_CORRECTIONS_FOR_TRAINING:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': f'Mínimo de {MIN_CORRECTIONS_FOR_TRAINING} correções necessárias',
                    'current_count': len(corrections)
                })
            }
        
        # Agrupar por campo corrigido
        by_field = {}
        for correction in corrections:
            field = correction.get('corrected_field', 'unknown')
            if field not in by_field:
                by_field[field] = []
            by_field[field].append(correction)
        
        # Gerar dataset para headers
        header_dataset = []
        for field in ALLOWED_HEADER_FIELDS:
            if field in by_field:
                for corr in by_field[field]:
                    text_sample = corr.get('extracted_text_sample', '')
                    if text_sample:
                        header_dataset.append({
                            'text': text_sample[:MAX_TEXT_SAMPLE_LENGTH],
                            'field': field,
                            'correct_value': corr.get('corrected_value'),
                            'wrong_value': corr.get('original_value'),
                            'correction_type': corr.get('correction_type')
                        })
        
        # Gerar dataset para biomarcadores
        biomarker_dataset = []
        for field in ALLOWED_BIOMARKER_FIELDS:
            if field in by_field:
                for corr in by_field[field]:
                    text_sample = corr.get('extracted_text_sample', '')
                    if text_sample:
                        biomarker_dataset.append({
                            'text': text_sample[:MAX_TEXT_SAMPLE_LENGTH],
                            'field': field,
                            'correct_value': corr.get('corrected_value'),
                            'wrong_value': corr.get('original_value'),
                            'correction_type': corr.get('correction_type')
                        })
        
        # Preparar resposta
        training_data = {
            'export_date': datetime.now().isoformat(),
            'total_corrections': len(corrections),
            'header_corrections': len(header_dataset),
            'biomarker_corrections': len(biomarker_dataset),
            'corrections_by_field': {k: len(v) for k, v in by_field.items()},
            'datasets': {
                'headers': header_dataset,
                'biomarkers': biomarker_dataset
            }
        }
        
        logger.info(f"✅ Export completo: {len(corrections)} correções")
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(training_data)
        }
        
    except Exception as e:
        logger.error(f"❌ Erro no export: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }


def get_correction_stats(corrections_table, exams_table) -> Dict[str, Any]:
    """
    Retorna estatísticas detalhadas de correções
    
    Args:
        corrections_table: Tabela DynamoDB de correções
        exams_table: Tabela DynamoDB de exames
        
    Returns:
        Response dict com estatísticas
    """
    try:
        logger.info("📊 Calculando estatísticas de correções")
        
        # Buscar todas as correções
        response = corrections_table.scan()
        corrections = response.get('Items', [])
        
        if not corrections:
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'total_corrections': 0,
                    'by_field': {},
                    'by_type': {},
                    'header_vs_biomarker': {'header': 0, 'biomarker': 0}
                })
            }
        
        # Contar por campo
        by_field = Counter(c.get('corrected_field') for c in corrections)
        
        # Contar por tipo
        by_type = Counter(c.get('correction_type') for c in corrections)
        
        # Header vs Biomarker
        header_count = sum(1 for c in corrections if c.get('is_header', False))
        biomarker_count = len(corrections) - header_count
        
        # Exames únicos corrigidos
        unique_exams = len(set(c.get('exam_id') for c in corrections))
        
        stats = {
            'total_corrections': len(corrections),
            'unique_exams_corrected': unique_exams,
            'by_field': dict(by_field),
            'by_type': dict(by_type),
            'header_vs_biomarker': {
                'header': header_count,
                'biomarker': biomarker_count
            },
            'ready_for_training': len(corrections) >= MIN_CORRECTIONS_FOR_TRAINING
        }
        
        logger.info(f"✅ Stats: {len(corrections)} correções totais")
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(stats)
        }
        
    except Exception as e:
        logger.error(f"❌ Erro calculando stats: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }
