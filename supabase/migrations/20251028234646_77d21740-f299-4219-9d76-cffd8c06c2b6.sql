-- Adicionar coluna filename na tabela exams
ALTER TABLE public.exams 
ADD COLUMN filename TEXT;

-- Criar índice para facilitar buscas por filename
CREATE INDEX idx_exams_filename ON public.exams(filename);

-- Comentário explicativo
COMMENT ON COLUMN public.exams.filename IS 'Nome do arquivo original (sanitizado) enviado pelo usuário';