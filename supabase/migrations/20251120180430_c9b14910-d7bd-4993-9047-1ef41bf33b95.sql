-- Criar tabela para overrides de categorias de biomarcadores
CREATE TABLE IF NOT EXISTS public.biomarker_category_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  biomarker_name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  display_order INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_biomarker_overrides_name ON public.biomarker_category_overrides(biomarker_name);
CREATE INDEX IF NOT EXISTS idx_biomarker_overrides_category ON public.biomarker_category_overrides(category);

-- Habilitar RLS
ALTER TABLE public.biomarker_category_overrides ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem gerenciar overrides
CREATE POLICY "Admins podem gerenciar category overrides"
ON public.biomarker_category_overrides
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Todos podem visualizar overrides (necessário para categorização)
CREATE POLICY "Todos podem visualizar category overrides"
ON public.biomarker_category_overrides
FOR SELECT
TO authenticated
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_biomarker_overrides_updated_at
BEFORE UPDATE ON public.biomarker_category_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();