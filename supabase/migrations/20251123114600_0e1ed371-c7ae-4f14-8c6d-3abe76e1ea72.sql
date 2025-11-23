-- Adicionar coluna de arquivamento à tabela patients
ALTER TABLE public.patients 
ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN archived_by UUID REFERENCES auth.users(id);

-- Adicionar índice para melhorar performance nas queries de pacientes ativos
CREATE INDEX idx_patients_archived ON public.patients(archived, professional_id);

-- Comentários para documentação
COMMENT ON COLUMN public.patients.archived IS 'Indica se o paciente está arquivado (soft delete)';
COMMENT ON COLUMN public.patients.archived_at IS 'Data e hora em que o paciente foi arquivado';
COMMENT ON COLUMN public.patients.archived_by IS 'ID do usuário que arquivou o paciente';