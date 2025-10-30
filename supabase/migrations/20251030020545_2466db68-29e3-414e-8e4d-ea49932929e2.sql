-- Adicionar valor 'indeterminado' ao enum biomarker_status
-- Isso permite que biomarcadores sem valores de referência sejam inseridos corretamente
ALTER TYPE biomarker_status ADD VALUE IF NOT EXISTS 'indeterminado';