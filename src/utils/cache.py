"""
Sistema de Cache S3 para Headers de Pacientes
Reduz chamadas à API Claude Vision em ~15%
"""

import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any


class HeaderCacheS3:
    """
    Cache inteligente baseado em S3 para headers de pacientes
    
    - Key: hash(nome + data_nascimento)
    - TTL: 90 dias
    - Invalidação: se laboratório mudar
    """
    
    def __init__(self, bucket_name: str, s3_client, ttl_days: int = 90):
        """
        Args:
            bucket_name: Nome do bucket S3 para cache
            s3_client: Cliente boto3 S3
            ttl_days: Tempo de vida do cache em dias
        """
        self.bucket_name = bucket_name
        self.s3_client = s3_client
        self.ttl_days = ttl_days
        self.enabled = bucket_name is not None
        
        if not self.enabled:
            print('⚠️ Cache S3 desabilitado (CACHE_BUCKET não configurado)')
    
    def _make_patient_key(self, nome: str, data_nascimento: str) -> str:
        """
        Gera chave única baseada em nome + data de nascimento
        
        Args:
            nome: Nome do paciente
            data_nascimento: Data no formato DD/MM/YYYY
            
        Returns:
            str: Hash MD5 como chave
        """
        # Normalizar dados para hash consistente
        nome_clean = nome.strip().lower()
        data_clean = data_nascimento.strip()
        
        # Combinar e gerar hash
        combined = f"{nome_clean}|{data_clean}"
        hash_key = hashlib.md5(combined.encode('utf-8')).hexdigest()
        
        return f"patient-headers/{hash_key}.json"
    
    def _is_expired(self, cache_data: Dict[str, Any]) -> bool:
        """
        Verifica se entrada do cache expirou
        
        Args:
            cache_data: Dados do cache com timestamp
            
        Returns:
            bool: True se expirado
        """
        try:
            cached_at = datetime.fromisoformat(cache_data.get('cached_at', ''))
            expiration = cached_at + timedelta(days=self.ttl_days)
            return datetime.utcnow() > expiration
        except (ValueError, TypeError):
            return True
    
    def _labs_match(self, cached_lab: str, current_lab: str, threshold: float = 0.8) -> bool:
        """
        Verifica se laboratórios são compatíveis (fuzzy match)
        
        Args:
            cached_lab: Nome do lab no cache
            current_lab: Nome do lab atual
            threshold: Limite de similaridade
            
        Returns:
            bool: True se labs são compatíveis
        """
        if not cached_lab or not current_lab:
            return True  # Se um dos dois estiver vazio, aceitar
        
        # Normalizar
        lab1 = cached_lab.strip().lower()
        lab2 = current_lab.strip().lower()
        
        # Verificar se um contém o outro
        if lab1 in lab2 or lab2 in lab1:
            return True
        
        # Similaridade simples (pode melhorar com difflib se necessário)
        from difflib import SequenceMatcher
        similarity = SequenceMatcher(None, lab1, lab2).ratio()
        
        return similarity >= threshold
    
    def get(self, nome: str, data_nascimento: str, current_lab: str = '') -> Optional[Dict[str, Any]]:
        """
        Recupera header do cache se válido
        
        Args:
            nome: Nome do paciente
            data_nascimento: Data de nascimento
            current_lab: Laboratório atual (para validação)
            
        Returns:
            Dict com header ou None se cache miss/inválido
        """
        if not self.enabled:
            return None
        
        try:
            key = self._make_patient_key(nome, data_nascimento)
            
            # Tentar recuperar do S3
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            cache_data = json.loads(response['Body'].read().decode('utf-8'))
            
            # Validar expiração
            if self._is_expired(cache_data):
                print(f'⏰ Cache expirado para {nome[:20]}...')
                return None
            
            # Validar laboratório
            cached_lab = cache_data.get('header', {}).get('laboratorio', '')
            if not self._labs_match(cached_lab, current_lab):
                print(f'🔄 Laboratório mudou para {nome[:20]}... (cache: {cached_lab}, atual: {current_lab})')
                return None
            
            print(f'✅ Cache HIT para {nome[:20]}... (economia: ~$0.009)')
            return cache_data.get('header')
            
        except self.s3_client.exceptions.NoSuchKey:
            print(f'❌ Cache MISS para {nome[:20]}...')
            return None
        except Exception as e:
            print(f'⚠️ Erro ao ler cache: {e}')
            return None
    
    def put(self, nome: str, data_nascimento: str, header: Dict[str, Any]) -> bool:
        """
        Salva header no cache
        
        Args:
            nome: Nome do paciente
            data_nascimento: Data de nascimento
            header: Dados do header extraídos
            
        Returns:
            bool: True se salvou com sucesso
        """
        if not self.enabled:
            return False
        
        try:
            key = self._make_patient_key(nome, data_nascimento)
            
            # Preparar dados do cache
            cache_data = {
                'header': header,
                'cached_at': datetime.utcnow().isoformat(),
                'ttl_days': self.ttl_days
            }
            
            # Salvar no S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=json.dumps(cache_data, ensure_ascii=False, indent=2),
                ContentType='application/json'
            )
            
            print(f'💾 Header salvo no cache para {nome[:20]}...')
            return True
            
        except Exception as e:
            print(f'⚠️ Erro ao salvar cache: {e}')
            return False
