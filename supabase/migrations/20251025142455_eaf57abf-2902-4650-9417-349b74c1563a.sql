-- Correção definitiva de hemácias: normalizar todos os registros históricos

-- 1. Atualizar registros onde value_numeric está populado E > 100
UPDATE exam_results
SET 
  value_numeric = value_numeric / 1000000.0,
  value = (value_numeric / 1000000.0)::text,
  reference_min = CASE 
    WHEN reference_min IS NOT NULL AND reference_min > 100 
    THEN reference_min / 1000000.0
    ELSE reference_min
  END,
  reference_max = CASE 
    WHEN reference_max IS NOT NULL AND reference_max > 100 
    THEN reference_max / 1000000.0
    ELSE reference_max
  END,
  unit = 'milhões/mm³'
WHERE 
  (biomarker_name ILIKE '%hemácia%' OR biomarker_name ILIKE '%hemacia%' OR biomarker_name ILIKE '%eritrócito%' OR biomarker_name ILIKE '%eritrocito%')
  AND value_numeric IS NOT NULL
  AND value_numeric > 100;

-- 2. Atualizar registros onde value_numeric é NULL mas value (string) é grande
UPDATE exam_results
SET 
  value_numeric = (REPLACE(REPLACE(value, '.', ''), ',', '.')::numeric) / 1000000.0,
  value = ((REPLACE(REPLACE(value, '.', ''), ',', '.')::numeric) / 1000000.0)::text,
  reference_min = CASE 
    WHEN reference_min IS NOT NULL AND reference_min > 100 
    THEN reference_min / 1000000.0
    ELSE reference_min
  END,
  reference_max = CASE 
    WHEN reference_max IS NOT NULL AND reference_max > 100 
    THEN reference_max / 1000000.0
    ELSE reference_max
  END,
  unit = 'milhões/mm³'
WHERE 
  (biomarker_name ILIKE '%hemácia%' OR biomarker_name ILIKE '%hemacia%' OR biomarker_name ILIKE '%eritrócito%' OR biomarker_name ILIKE '%eritrocito%')
  AND value_numeric IS NULL
  AND value IS NOT NULL
  AND LENGTH(REPLACE(REPLACE(value, '.', ''), ',', '.')) > 0
  AND REPLACE(REPLACE(value, '.', ''), ',', '.') ~ '^\d+\.?\d*$'
  AND (REPLACE(REPLACE(value, '.', ''), ',', '.')::numeric) > 100000;