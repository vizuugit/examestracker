-- Adicionar campos de auditoria de normalização à tabela exam_results
ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS original_name TEXT,
ADD COLUMN IF NOT EXISTS normalization_confidence NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS normalization_type TEXT CHECK (normalization_type IN ('exact', 'synonym', 'fuzzy', 'manual')),
ADD COLUMN IF NOT EXISTS validation_warnings JSONB;

-- Criar índice para busca por nome original
CREATE INDEX IF NOT EXISTS idx_exam_results_original_name ON exam_results(original_name);

-- Criar tabela de biomarcadores rejeitados
CREATE TABLE IF NOT EXISTS rejected_biomarkers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  original_value TEXT,
  rejection_reason TEXT NOT NULL,
  suggestions TEXT[],
  similarity_score NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de duplicatas detectadas
CREATE TABLE IF NOT EXISTS biomarker_duplicates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  biomarker_name TEXT NOT NULL,
  conflict_type TEXT NOT NULL,
  conflicting_values JSONB NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE rejected_biomarkers ENABLE ROW LEVEL SECURITY;
ALTER TABLE biomarker_duplicates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para rejected_biomarkers
CREATE POLICY "Professionals can view own rejected biomarkers"
  ON rejected_biomarkers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams 
      WHERE exams.id = rejected_biomarkers.exam_id 
      AND (exams.uploaded_by = auth.uid() OR 
           EXISTS (SELECT 1 FROM patients WHERE patients.id = exams.patient_id AND patients.professional_id = auth.uid()))
    )
  );

CREATE POLICY "Professionals can insert rejected biomarkers"
  ON rejected_biomarkers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exams 
      WHERE exams.id = rejected_biomarkers.exam_id 
      AND (exams.uploaded_by = auth.uid() OR 
           EXISTS (SELECT 1 FROM patients WHERE patients.id = exams.patient_id AND patients.professional_id = auth.uid()))
    )
  );

-- Políticas RLS para biomarker_duplicates
CREATE POLICY "Professionals can view own duplicates"
  ON biomarker_duplicates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams 
      WHERE exams.id = biomarker_duplicates.exam_id 
      AND (exams.uploaded_by = auth.uid() OR 
           EXISTS (SELECT 1 FROM patients WHERE patients.id = exams.patient_id AND patients.professional_id = auth.uid()))
    )
  );

CREATE POLICY "Professionals can insert duplicates"
  ON biomarker_duplicates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exams 
      WHERE exams.id = biomarker_duplicates.exam_id 
      AND (exams.uploaded_by = auth.uid() OR 
           EXISTS (SELECT 1 FROM patients WHERE patients.id = exams.patient_id AND patients.professional_id = auth.uid()))
    )
  );

CREATE POLICY "Professionals can update own duplicates"
  ON biomarker_duplicates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM exams 
      WHERE exams.id = biomarker_duplicates.exam_id 
      AND (exams.uploaded_by = auth.uid() OR 
           EXISTS (SELECT 1 FROM patients WHERE patients.id = exams.patient_id AND patients.professional_id = auth.uid()))
    )
  );

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_rejected_biomarkers_exam_id ON rejected_biomarkers(exam_id);
CREATE INDEX IF NOT EXISTS idx_biomarker_duplicates_exam_id ON biomarker_duplicates(exam_id);
CREATE INDEX IF NOT EXISTS idx_biomarker_duplicates_resolved ON biomarker_duplicates(resolved);