-- Normalizar valores de hemácias já existentes no banco
-- Converte valores absolutos (ex: 5250000) para milhões (ex: 5.25)
UPDATE exam_results
SET 
  value_numeric = CASE 
    WHEN value_numeric > 100 THEN value_numeric / 1000000.0
    ELSE value_numeric
  END,
  reference_min = CASE 
    WHEN reference_min IS NOT NULL AND reference_min > 100 THEN reference_min / 1000000.0
    ELSE reference_min
  END,
  reference_max = CASE 
    WHEN reference_max IS NOT NULL AND reference_max > 100 THEN reference_max / 1000000.0
    ELSE reference_max
  END,
  unit = 'milhões/mm³'
WHERE 
  (biomarker_name ILIKE '%hemácia%' OR biomarker_name ILIKE '%hemacia%' OR biomarker_name ILIKE '%eritrócito%')
  AND value_numeric > 100;