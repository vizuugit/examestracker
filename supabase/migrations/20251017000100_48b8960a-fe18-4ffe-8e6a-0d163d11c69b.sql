-- Habilitar Realtime para a tabela exams
-- Isso permite que o frontend escute mudanças em tempo real

ALTER PUBLICATION supabase_realtime ADD TABLE public.exams;