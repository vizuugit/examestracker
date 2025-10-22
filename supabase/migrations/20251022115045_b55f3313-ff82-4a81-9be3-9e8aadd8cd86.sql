-- Deletar duplicatas de exam_results mantendo o mais recente por exam_id + biomarker_name
WITH ranked_results AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY exam_id, biomarker_name 
      ORDER BY created_at DESC
    ) as rn
  FROM exam_results
  WHERE exam_id IN (
    SELECT id FROM exams 
    WHERE patient_id = '7172cf9a-2b43-49ea-9ba2-44298ceda28f'
  )
)
DELETE FROM exam_results
WHERE id IN (
  SELECT id FROM ranked_results WHERE rn > 1
);

-- Deletar exams duplicados mantendo o mais recente por patient_id + exam_date
WITH ranked_exams AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY patient_id, exam_date 
      ORDER BY created_at DESC
    ) as rn
  FROM exams
  WHERE patient_id = '7172cf9a-2b43-49ea-9ba2-44298ceda28f'
)
DELETE FROM exams
WHERE id IN (
  SELECT id FROM ranked_exams WHERE rn > 1
);