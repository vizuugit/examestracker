-- Tabela para armazenar variações/sinônimos customizados de biomarcadores
CREATE TABLE IF NOT EXISTS public.biomarker_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  biomarker_normalized_name TEXT NOT NULL,
  variation TEXT NOT NULL UNIQUE,
  category TEXT,
  unit TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  active BOOLEAN DEFAULT true,
  CONSTRAINT biomarker_variations_variation_lower_check CHECK (variation = LOWER(TRIM(variation)))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_biomarker_variations_normalized ON public.biomarker_variations(biomarker_normalized_name);
CREATE INDEX IF NOT EXISTS idx_biomarker_variations_variation ON public.biomarker_variations(variation);
CREATE INDEX IF NOT EXISTS idx_biomarker_variations_active ON public.biomarker_variations(active);

-- RLS Policies
ALTER TABLE public.biomarker_variations ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar tudo
CREATE POLICY "Admins podem gerenciar variações de biomarcadores"
ON public.biomarker_variations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Todos podem visualizar variações ativas
CREATE POLICY "Todos podem visualizar variações ativas"
ON public.biomarker_variations
FOR SELECT
TO authenticated
USING (active = true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_biomarker_variations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_biomarker_variations_updated_at
BEFORE UPDATE ON public.biomarker_variations
FOR EACH ROW
EXECUTE FUNCTION update_biomarker_variations_updated_at();

-- Comentários
COMMENT ON TABLE public.biomarker_variations IS 'Armazena variações/sinônimos customizados de biomarcadores que complementam a tabela estática de normalização';
COMMENT ON COLUMN public.biomarker_variations.biomarker_normalized_name IS 'Nome normalizado do biomarcador (ex: Glicemia Jejum)';
COMMENT ON COLUMN public.biomarker_variations.variation IS 'Variação/sinônimo do biomarcador (ex: glicose, glucose fasting)';
COMMENT ON COLUMN public.biomarker_variations.active IS 'Se false, a variação não será usada na normalização';