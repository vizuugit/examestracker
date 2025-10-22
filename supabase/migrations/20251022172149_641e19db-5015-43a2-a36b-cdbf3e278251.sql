-- ========================================
-- Sistema de Correção de Biomarcadores
-- Adiciona rastreamento de correções manuais
-- ========================================

-- Adicionar colunas para rastreamento de correções
ALTER TABLE exam_results
  ADD COLUMN manually_corrected BOOLEAN DEFAULT false,
  ADD COLUMN corrected_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para melhor performance nas queries de biomarcadores corrigidos
CREATE INDEX idx_exam_results_manually_corrected
  ON exam_results(manually_corrected)
  WHERE manually_corrected = true;

-- Comentários para documentação
COMMENT ON COLUMN exam_results.manually_corrected IS 'Indica se o biomarcador foi corrigido manualmente pelo usuário';
COMMENT ON COLUMN exam_results.corrected_at IS 'Timestamp da última correção manual';