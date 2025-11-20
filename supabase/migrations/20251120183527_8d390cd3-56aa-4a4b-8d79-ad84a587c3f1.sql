-- Criar tabela para ordem customizada de categorias
CREATE TABLE category_display_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key TEXT UNIQUE NOT NULL,
  display_order INTEGER NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE category_display_order ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar a ordem das categorias
CREATE POLICY "Admins podem gerenciar ordem de categorias"
  ON category_display_order
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Todos podem visualizar a ordem das categorias
CREATE POLICY "Todos podem visualizar ordem de categorias"
  ON category_display_order
  FOR SELECT
  USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_category_display_order_updated_at
  BEFORE UPDATE ON category_display_order
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();