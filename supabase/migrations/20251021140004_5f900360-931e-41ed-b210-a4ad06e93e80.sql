-- Adicionar data de nascimento em patients (se ainda não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'patients' 
    AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE public.patients ADD COLUMN birth_date DATE;
    COMMENT ON COLUMN public.patients.birth_date IS 'Data de nascimento do paciente, extraída dos exames';
  END IF;
END $$;