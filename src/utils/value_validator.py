"""
Value Validator - Validação de valores de biomarcadores
Validação e normalização de valores extraídos de laudos
"""

import re
from typing import Tuple, Optional


def normalizar_valor(valor: str) -> str:
    """
    Normaliza valor de biomarcador
    
    Args:
        valor: Valor bruto extraído
        
    Returns:
        Valor normalizado
    """
    if not valor:
        return ""
    
    texto = str(valor).strip()
    
    # Valores qualitativos
    qualitativos = ['negativo', 'positivo', 'não reagente', 'reagente', 'indetectável']
    if texto.lower() in qualitativos:
        return texto.lower()
    
    # Substituir vírgula por ponto
    texto = texto.replace(',', '.')
    
    # Remover espaços em valores numéricos
    if re.match(r'^-?\d+\.?\d*(e[+-]?\d+)?$', texto, re.IGNORECASE):
        texto = texto.replace(' ', '')
    
    return texto


def validar_formato_valor(valor: str) -> Tuple[bool, Optional[str]]:
    """
    Valida formato do valor
    
    Args:
        valor: Valor a validar
        
    Returns:
        Tupla (valido: bool, erro: Optional[str])
    """
    if not valor:
        return (False, "Valor vazio")
    
    texto = normalizar_valor(valor)
    
    # Valores qualitativos aceitos
    qualitativos = ['negativo', 'positivo', 'não reagente', 'reagente', 'indetectável']
    if texto in qualitativos:
        return (True, None)
    
    # Valores numéricos
    if re.match(r'^-?\d+\.?\d*(e[+-]?\d+)?$', texto, re.IGNORECASE):
        return (True, None)
    
    return (False, f"Formato inválido: {valor}")
