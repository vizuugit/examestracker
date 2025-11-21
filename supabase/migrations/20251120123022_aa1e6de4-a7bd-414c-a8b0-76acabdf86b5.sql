-- ========================================
-- TABELA DE CONVITES (COM MELHORIAS)
-- ========================================

CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Dados do convite
  invited_role app_role NOT NULL DEFAULT 'professional',
  
  -- Timestamps e status
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  
  -- Dados preenchidos pelo convidado
  full_name text,
  specialty text,
  
  -- Auditoria
  resent_count int DEFAULT 0,
  last_resent_at timestamptz,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Índices otimizados
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_status ON public.invitations(status);
CREATE INDEX idx_invitations_invited_by ON public.invitations(invited_by);
CREATE INDEX idx_invitations_expires_at ON public.invitations(expires_at);

-- ========================================
-- TABELA DE NOTIFICAÇÕES ADMIN
-- ========================================

CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('invitation_accepted', 'invitation_expired')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  related_invitation_id uuid REFERENCES public.invitations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_notifications_admin_id ON public.admin_notifications(admin_id);
CREATE INDEX idx_admin_notifications_read ON public.admin_notifications(read);

-- ========================================
-- FUNÇÃO: MARCAR CONVITES EXPIRADOS
-- ========================================

CREATE OR REPLACE FUNCTION mark_expired_invitations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.expires_at < now() AND NEW.status = 'pending' THEN
    NEW.status := 'expired';
    
    INSERT INTO public.admin_notifications (
      admin_id, 
      type, 
      title, 
      message, 
      related_invitation_id
    )
    VALUES (
      NEW.invited_by,
      'invitation_expired',
      'Convite expirado',
      'O convite para ' || NEW.email || ' expirou sem ser aceito.',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_invitation_expiration
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION mark_expired_invitations();

-- ========================================
-- FUNÇÃO: NOTIFICAR ADMIN QUANDO ACEITO
-- ========================================

CREATE OR REPLACE FUNCTION notify_admin_invitation_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO public.admin_notifications (
      admin_id,
      type,
      title,
      message,
      related_invitation_id
    )
    VALUES (
      NEW.invited_by,
      'invitation_accepted',
      'Novo profissional cadastrado',
      NEW.full_name || ' (' || NEW.email || ') aceitou o convite e criou sua conta.',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_invitation_accepted
  AFTER UPDATE ON public.invitations
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status != 'accepted')
  EXECUTE FUNCTION notify_admin_invitation_accepted();

-- ========================================
-- RLS POLICIES
-- ========================================

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Invitations: Admins full access
CREATE POLICY "Admins podem gerenciar convites"
  ON public.invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Invitations: Public read by token
CREATE POLICY "Convite pode ser visualizado por token"
  ON public.invitations FOR SELECT
  USING (true);

-- Invitations: Update durante aceite
CREATE POLICY "Convite pode ser aceito com token válido"
  ON public.invitations FOR UPDATE
  USING (status = 'pending' AND expires_at > now());

-- Notifications: Admin vê suas próprias notificações
CREATE POLICY "Admin vê suas notificações"
  ON public.admin_notifications FOR SELECT
  USING (admin_id = auth.uid());

CREATE POLICY "Admin pode marcar como lida"
  ON public.admin_notifications FOR UPDATE
  USING (admin_id = auth.uid());