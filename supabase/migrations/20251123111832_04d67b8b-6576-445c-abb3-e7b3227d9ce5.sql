-- Configurar Foreign Keys com ON DELETE CASCADE para garantir exclusão em cascata

-- 1. Atualizar foreign key em exam_results
ALTER TABLE exam_results 
DROP CONSTRAINT IF EXISTS exam_results_exam_id_fkey;

ALTER TABLE exam_results
ADD CONSTRAINT exam_results_exam_id_fkey 
FOREIGN KEY (exam_id) 
REFERENCES exams(id) 
ON DELETE CASCADE;

-- 2. Atualizar foreign key em exams para pacientes
ALTER TABLE exams 
DROP CONSTRAINT IF EXISTS exams_patient_id_fkey;

ALTER TABLE exams
ADD CONSTRAINT exams_patient_id_fkey 
FOREIGN KEY (patient_id) 
REFERENCES patients(id) 
ON DELETE CASCADE;

-- 3. Garantir cascade em biomarker_duplicates
ALTER TABLE biomarker_duplicates 
DROP CONSTRAINT IF EXISTS biomarker_duplicates_exam_id_fkey;

ALTER TABLE biomarker_duplicates
ADD CONSTRAINT biomarker_duplicates_exam_id_fkey 
FOREIGN KEY (exam_id) 
REFERENCES exams(id) 
ON DELETE CASCADE;

-- 4. Garantir cascade em rejected_biomarkers
ALTER TABLE rejected_biomarkers 
DROP CONSTRAINT IF EXISTS rejected_biomarkers_exam_id_fkey;

ALTER TABLE rejected_biomarkers
ADD CONSTRAINT rejected_biomarkers_exam_id_fkey 
FOREIGN KEY (exam_id) 
REFERENCES exams(id) 
ON DELETE CASCADE;

-- 5. Garantir cascade em corrections
ALTER TABLE corrections 
DROP CONSTRAINT IF EXISTS corrections_exam_id_fkey;

ALTER TABLE corrections
ADD CONSTRAINT corrections_exam_id_fkey 
FOREIGN KEY (exam_id) 
REFERENCES exams(id) 
ON DELETE CASCADE;