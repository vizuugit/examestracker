#!/bin/bash

# Deploy Script para Lambda HealthTrack
# Empacota código Python e faz deploy para AWS Lambda

set -e

LAMBDA_FUNCTION_NAME="process-exam"
DEPLOYMENT_PACKAGE="lambda-deployment.zip"

echo "🚀 Iniciando deploy da Lambda ${LAMBDA_FUNCTION_NAME}..."

# Limpar diretório de build anterior
echo "🧹 Limpando build anterior..."
rm -rf dist/
rm -f ${DEPLOYMENT_PACKAGE}

# Criar diretório de distribuição
echo "📦 Criando diretório de distribuição..."
mkdir -p dist

# Instalar dependências Python
echo "📥 Instalando dependências..."
pip install -r requirements.txt -t dist/ --quiet

# Copiar código fonte (inclui src/data/biomarker-specification-v2.json)
echo "📋 Copiando código fonte..."
cp -r src dist/
cp lambda_function.py dist/
# Arquivo antigo mantido para compatibilidade (caso exista)
[ -f especificacao_biomarcadores.json ] && cp especificacao_biomarcadores.json dist/ || true

# Criar ZIP
echo "🗜️ Criando pacote ZIP..."
cd dist && zip -r ../${DEPLOYMENT_PACKAGE} . -q && cd ..

# Verificar tamanho do pacote
PACKAGE_SIZE=$(du -h ${DEPLOYMENT_PACKAGE} | cut -f1)
echo "📏 Tamanho do pacote: ${PACKAGE_SIZE}"

# Fazer deploy para AWS Lambda
echo "☁️ Fazendo deploy para AWS Lambda..."
aws lambda update-function-code \
    --function-name ${LAMBDA_FUNCTION_NAME} \
    --zip-file fileb://${DEPLOYMENT_PACKAGE} \
    --no-cli-pager

echo "✅ Deploy concluído com sucesso!"
echo ""
echo "🔍 Próximos passos:"
echo "1. Verificar logs: aws logs tail /aws/lambda/${LAMBDA_FUNCTION_NAME} --follow"
echo "2. Testar função via Console AWS ou CLI"
echo "3. Monitorar métricas no CloudWatch"
