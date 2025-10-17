-- Atualizar política RLS da tabela exams para permitir patient_id NULL durante upload
-- Isso é necessário para o fluxo de auto-matching

-- Remover política existente
DROP POLICY IF EXISTS "Manage exams of own patients" ON exams;
DROP POLICY IF EXISTS "View exams of own patients" ON exams;

-- Criar nova política para INSERT que permite patient_id NULL se o usuário é o uploader
CREATE POLICY "Professionals can create exams"
ON exams
FOR INSERT
WITH CHECK (
  -- Permite inserir se:
  -- 1. O usuário é o uploader E patient_id é NULL (auto-matching em progresso)
  -- 2. OU o patient_id pertence a um paciente do profissional
  (auth.uid() = uploaded_by AND patient_id IS NULL)
  OR
  (EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = exams.patient_id 
    AND patients.professional_id = auth.uid()
  ))
);

-- Política para UPDATE (permite atualizar exames próprios ou de seus pacientes)
CREATE POLICY "Professionals can update own exams"
ON exams
FOR UPDATE
USING (
  auth.uid() = uploaded_by
  OR
  (EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = exams.patient_id 
    AND patients.professional_id = auth.uid()
  ))
);

-- Política para SELECT (visualizar exames próprios ou de seus pacientes)
CREATE POLICY "Professionals can view own exams"
ON exams
FOR SELECT
USING (
  auth.uid() = uploaded_by
  OR
  (EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = exams.patient_id 
    AND patients.professional_id = auth.uid()
  ))
);

-- Política para DELETE (deletar exames próprios ou de seus pacientes)
CREATE POLICY "Professionals can delete own exams"
ON exams
FOR DELETE
USING (
  auth.uid() = uploaded_by
  OR
  (EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = exams.patient_id 
    AND patients.professional_id = auth.uid()
  ))
);