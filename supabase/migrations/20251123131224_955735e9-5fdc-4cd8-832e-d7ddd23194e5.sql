-- Criar tabela missing_biomarkers
CREATE TABLE IF NOT EXISTS public.missing_biomarkers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  biomarker_name TEXT NOT NULL,
  value TEXT NOT NULL,
  value_numeric NUMERIC,
  unit TEXT,
  reference_min NUMERIC,
  reference_max NUMERIC,
  suggested_category TEXT,
  observation TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar campo admin_notes às tabelas existentes
ALTER TABLE public.corrections ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.rejected_biomarkers ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.rejected_biomarkers ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE public.rejected_biomarkers ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.rejected_biomarkers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Atualizar admin_notifications para suportar mais tipos de referências
ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS related_correction_id UUID REFERENCES public.corrections(id) ON DELETE CASCADE;
ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS related_missing_biomarker_id UUID REFERENCES public.missing_biomarkers(id) ON DELETE CASCADE;
ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS related_rejected_biomarker_id UUID REFERENCES public.rejected_biomarkers(id) ON DELETE CASCADE;
ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Enable RLS
ALTER TABLE public.missing_biomarkers ENABLE ROW LEVEL SECURITY;

-- RLS Policies para missing_biomarkers
CREATE POLICY "Users can insert own missing biomarkers"
  ON public.missing_biomarkers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own missing biomarkers"
  ON public.missing_biomarkers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all missing biomarkers"
  ON public.missing_biomarkers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_missing_biomarkers_user_id ON public.missing_biomarkers(user_id);
CREATE INDEX IF NOT EXISTS idx_missing_biomarkers_exam_id ON public.missing_biomarkers(exam_id);
CREATE INDEX IF NOT EXISTS idx_missing_biomarkers_status ON public.missing_biomarkers(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_metadata ON public.admin_notifications USING GIN(metadata);