FROM public.ecr.aws/lambda/python:3.11

# Copiar código Python principal
COPY lambda_function.py ${LAMBDA_TASK_ROOT}/

# Copiar pasta src/ com módulos auxiliares e dados
# Inclui src/data/biomarker-specification-v2.json automaticamente
COPY src/ ${LAMBDA_TASK_ROOT}/src/

# Instalar dependências Python 
RUN pip install --no-cache-dir \
    anthropic==0.45.0 \
    boto3==1.34.162 \
    pillow==10.4.0 \
    PyMuPDF==1.24.0 \
    supabase==2.22.0 \
    requests==2.31.0 \
    rapidfuzz==3.6.1 \
    pillow-heif==0.16.0 \
    PyPDF2==3.0.1 \
    python-dateutil==2.8.2 \
    google-generativeai==0.8.3 \
    python-docx==1.1.2

# Handler
CMD ["lambda_function.lambda_handler"]
