-- ========================================
-- MIGRATION: Add Advanced Exam Insights
-- Adiciona colunas JSONB para insights gerados por IA
-- ========================================

-- 1. ADICIONAR COLUNAS À TABELA EXAMS
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS clinical_analysis JSONB,
ADD COLUMN IF NOT EXISTS alerts JSONB,
ADD COLUMN IF NOT EXISTS trends JSONB,
ADD COLUMN IF NOT EXISTS recommendations JSONB,
ADD COLUMN IF NOT EXISTS health_score INTEGER,
ADD COLUMN IF NOT EXISTS risk_category TEXT;

-- 2. ADICIONAR CONSTRAINTS DE VALIDAÇÃO
ALTER TABLE public.exams
ADD CONSTRAINT check_health_score CHECK (health_score IS NULL OR (health_score >= 0 AND health_score <= 100)),
ADD CONSTRAINT check_risk_category CHECK (risk_category IS NULL OR risk_category IN ('baixo', 'moderado', 'alto', 'crítico'));

-- 3. ADICIONAR COLUNAS À TABELA EXAM_RESULTS (insights individuais)
ALTER TABLE public.exam_results
ADD COLUMN IF NOT EXISTS deviation_percentage NUMERIC,
ADD COLUMN IF NOT EXISTS layman_explanation TEXT,
ADD COLUMN IF NOT EXISTS possible_causes JSONB;

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_exams_health_score ON public.exams(health_score) WHERE health_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exams_risk_category ON public.exams(risk_category) WHERE risk_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exams_patient_date ON public.exams(patient_id, exam_date DESC) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exams_alerts ON public.exams USING GIN(alerts) WHERE alerts IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exams_recommendations ON public.exams USING GIN(recommendations) WHERE recommendations IS NOT NULL;

-- 5. ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.exams.clinical_analysis IS 'Análise clínica estruturada gerada pelo Claude: resumo executivo, áreas de atenção, correlações, score de saúde';
COMMENT ON COLUMN public.exams.alerts IS 'Array de alertas de saúde (crítico, urgente, atenção, informativo) com ações sugeridas';
COMMENT ON COLUMN public.exams.trends IS 'Tendências comparadas com histórico do paciente (melhorias, pioras, estável)';
COMMENT ON COLUMN public.exams.recommendations IS 'Recomendações gerais baseadas nos resultados (consulta, estilo de vida, medicação, novos exames)';
COMMENT ON COLUMN public.exams.health_score IS 'Score geral de saúde calculado pela IA (0-100, onde 100 é perfeito)';
COMMENT ON COLUMN public.exams.risk_category IS 'Categoria de risco: baixo, moderado, alto, crítico';

COMMENT ON COLUMN public.exam_results.deviation_percentage IS 'Percentual de desvio em relação à média do intervalo de referência';
COMMENT ON COLUMN public.exam_results.layman_explanation IS 'Explicação em linguagem leiga do que este biomarcador mede';
COMMENT ON COLUMN public.exam_results.possible_causes IS 'Array de possíveis causas quando o valor está alterado';

-- 6. VERIFICAÇÃO DE INTEGRIDADE
DO $$
BEGIN
  -- Verificar se há exames com score mas sem categoria de risco
  IF EXISTS (
    SELECT 1 FROM public.exams 
    WHERE health_score IS NOT NULL 
    AND risk_category IS NULL
  ) THEN
    RAISE WARNING 'Existem exames com health_score mas sem risk_category definida';
  END IF;
END $$;

-- 7. ESTATÍSTICAS PÓS-MIGRAÇÃO
DO $$
DECLARE
  total_exams INTEGER;
  exams_with_insights INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_exams FROM public.exams;
  SELECT COUNT(*) INTO exams_with_insights FROM public.exams WHERE clinical_analysis IS NOT NULL;
  
  RAISE NOTICE '✅ Migração concluída!';
  RAISE NOTICE 'Total de exames: %', total_exams;
  RAISE NOTICE 'Exames com insights: %', exams_with_insights;
  RAISE NOTICE 'Novos campos adicionados: clinical_analysis, alerts, trends, recommendations, health_score, risk_category';
END $$;