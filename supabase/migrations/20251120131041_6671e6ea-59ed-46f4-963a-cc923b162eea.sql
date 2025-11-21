-- Adicionar coluna para rastrear primeiro login
ALTER TABLE public.profiles 
ADD COLUMN first_login_completed boolean DEFAULT false;

-- Atualizar usuários existentes para marcar como já tendo completado
UPDATE public.profiles 
SET first_login_completed = true;

-- Atualizar a função handle_new_user para incluir o novo campo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, first_login_completed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Profissional'),
    false
  );
  
  -- Primeiro usuário vira admin automaticamente
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Demais usuários começam como 'professional'
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'professional');
  END IF;
  
  RETURN NEW;
END;
$function$;