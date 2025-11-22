"""
Corrections Service - Sistema de Correções de Biomarcadores
Gerencia correções de headers e biomarcadores para treinamento futuro
"""

import json
import logging
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, List

from src.config import (
    ALLOWED_HEADER_FIELDS,
    ALLOWED_BIOMARKER_FIELDS,
    ALL_ALLOWED_FIELDS,
    CORRECTION_TYPES
)

logger = logging.getLogger(__name__)


def save_biomarker_correction(
    corrections_table,
    exam_id: str,
    patient_id: str,
    corrected_field: str,
    original_value: Any,
    corrected_value: Any,
    extracted_text_sample: str = None
) -> Dict[str, Any]:
    """
    Salva uma correção individual no DynamoDB
    
    Args:
        corrections_table: Tabela DynamoDB de correções
        exam_id: ID do exame
        patient_id: ID do paciente
        corrected_field: Campo corrigido
        original_value: Valor original da IA
        corrected_value: Valor corrigido pelo usuário
        extracted_text_sample: Amostra do texto extraído
        
    Returns:
        Item salvo
    """
    try:
        # Validar campo permitido
        if corrected_field not in ALL_ALLOWED_FIELDS:
            raise ValueError(f"Campo não permitido: {corrected_field}")
        
        # Detectar tipo de correção
        correction_type = detect_correction_type(corrected_field, original_value, corrected_value)
        
        # Criar item
        correction_item = {
            'correction_id': f"{exam_id}#{corrected_field}#{datetime.now().isoformat()}",
            'exam_id': exam_id,
            'patient_id': patient_id,
            'corrected_field': corrected_field,
            'original_value': str(original_value) if original_value is not None else None,
            'corrected_value': str(corrected_value) if corrected_value is not None else None,
            'correction_type': correction_type,
            'timestamp': datetime.now().isoformat(),
            'is_header': corrected_field in ALLOWED_HEADER_FIELDS
        }
        
        if extracted_text_sample:
            correction_item['extracted_text_sample'] = extracted_text_sample[:5000]
        
        # Salvar
        corrections_table.put_item(Item=correction_item)
        
        logger.info(f"✅ Correção salva: {corrected_field} | {correction_type}")
        return correction_item
        
    except Exception as e:
        logger.error(f"❌ Erro salvando correção: {e}")
        raise


def save_biomarker_corrections_batch(
    event: Dict[str, Any],
    corrections_table,
    exams_table
) -> Dict[str, Any]:
    """
    Salva múltiplas correções de biomarcadores em batch
    
    Args:
        event: Evento Lambda com body contendo corrections
        corrections_table: Tabela DynamoDB de correções
        exams_table: Tabela DynamoDB de exames
        
    Returns:
        Response dict
    """
    try:
        body = json.loads(event.get('body', '{}'))
        
        patient_id = body.get('patientId')
        exam_id = body.get('examId')
        corrections = body.get('corrections', [])
        
        if not exam_id or not patient_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'examId e patientId são obrigatórios'})
            }
        
        logger.info(f"📝 Salvando {len(corrections)} correções para exam {exam_id}")
        
        # Buscar texto extraído original
        extracted_text = get_extracted_text_from_exam(exams_table, exam_id)
        
        saved_corrections = []
        updated_biomarkers = []
        
        for correction in corrections:
            biomarker_id = correction.get('biomarkerId')
            corrected_field = correction.get('correctedField')
            original_value = correction.get('originalValue')
            corrected_value = correction.get('correctedValue')
            
            # Validar campos
            if not biomarker_id or not corrected_field:
                logger.warning(f"⚠️ Correção inválida ignorada: {correction}")
                continue
            
            if corrected_field not in ALLOWED_BIOMARKER_FIELDS:
                logger.warning(f"⚠️ Campo não permitido: {corrected_field}")
                continue
            
            # Salvar correção
            try:
                correction_item = save_biomarker_correction(
                    corrections_table=corrections_table,
                    exam_id=exam_id,
                    patient_id=patient_id,
                    corrected_field=corrected_field,
                    original_value=original_value,
                    corrected_value=corrected_value,
                    extracted_text_sample=extracted_text
                )
                saved_corrections.append(correction_item)
                
                # Atualizar biomarcador no DynamoDB
                update_result = update_biomarker_with_correction(
                    exams_table=exams_table,
                    exam_id=exam_id,
                    biomarker_id=biomarker_id,
                    corrected_field=corrected_field,
                    corrected_value=corrected_value
                )
                
                if update_result:
                    updated_biomarkers.append(biomarker_id)
                
            except Exception as e:
                logger.error(f"❌ Erro processando correção: {e}")
        
        response_body = {
            'success': True,
            'corrections_saved': len(saved_corrections),
            'biomarkers_updated': len(updated_biomarkers),
            'exam_id': exam_id
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        logger.error(f"❌ Erro no batch de correções: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }


def update_biomarker_with_correction(
    exams_table,
    exam_id: str,
    biomarker_id: str,
    corrected_field: str,
    corrected_value: Any
) -> bool:
    """
    Atualiza biomarcador no DynamoDB com valor corrigido
    
    Args:
        exams_table: Tabela DynamoDB de exames
        exam_id: ID do exame
        biomarker_id: ID do biomarcador
        corrected_field: Campo a atualizar
        corrected_value: Novo valor
        
    Returns:
        True se sucesso
    """
    try:
        # Buscar exame
        response = exams_table.get_item(Key={'exam_id': exam_id})
        exam = response.get('Item')
        
        if not exam:
            logger.error(f"❌ Exame não encontrado: {exam_id}")
            return False
        
        # Encontrar biomarcador na lista
        biomarkers = exam.get('biomarkers', [])
        updated = False
        
        for biomarker in biomarkers:
            if biomarker.get('biomarker_id') == biomarker_id:
                # Atualizar campo
                old_value = biomarker.get(corrected_field)
                biomarker[corrected_field] = corrected_value
                
                # Converter para Decimal se numérico
                if isinstance(corrected_value, (int, float)):
                    biomarker[corrected_field] = Decimal(str(corrected_value))
                
                logger.info(f"✅ Biomarcador atualizado: {corrected_field}: {old_value} → {corrected_value}")
                updated = True
                break
        
        if not updated:
            logger.warning(f"⚠️ Biomarcador não encontrado: {biomarker_id}")
            return False
        
        # Salvar exame atualizado
        exams_table.put_item(Item=exam)
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro atualizando biomarcador: {e}")
        return False


def get_extracted_text_from_exam(exams_table, exam_id: str) -> str:
    """
    Busca texto extraído original do exame
    
    Args:
        exams_table: Tabela DynamoDB
        exam_id: ID do exame
        
    Returns:
        Texto extraído ou string vazia
    """
    try:
        response = exams_table.get_item(Key={'exam_id': exam_id})
        exam = response.get('Item')
        
        if exam and 'extracted_text' in exam:
            return exam['extracted_text']
        
        return ''
        
    except Exception as e:
        logger.warning(f"⚠️ Erro buscando texto extraído: {e}")
        return ''


def detect_correction_type(
    corrected_field: str,
    original_value: Any,
    corrected_value: Any
) -> str:
    """
    Detecta tipo de correção automaticamente
    
    Args:
        corrected_field: Campo corrigido
        original_value: Valor original
        corrected_value: Valor corrigido
        
    Returns:
        Tipo de correção
    """
    # Headers
    if corrected_field == 'paciente':
        # Verificar se nome virou laboratório
        lab_terms = ['laboratorio', 'lab', 'clinica', 'hospital']
        if any(term in str(original_value).lower() for term in lab_terms):
            return 'nome_virou_lab'
        return 'outro'
    
    if corrected_field == 'laboratorio':
        # Verificar se laboratório virou nome
        from src.utils import is_valid_patient_name
        if is_valid_patient_name(str(original_value)):
            return 'lab_virou_nome'
        return 'outro'
    
    if corrected_field == 'data_exame':
        return 'data_exame_errada'
    
    if corrected_field == 'data_nascimento':
        return 'data_nascimento_errada'
    
    # Biomarcadores
    if corrected_field == 'biomarker_value':
        return 'valor_biomarker_errado'
    
    if corrected_field == 'biomarker_unit':
        return 'unidade_incorreta'
    
    if corrected_field in ['reference_min', 'reference_max']:
        return 'referencia_incorreta'
    
    return 'outro'
