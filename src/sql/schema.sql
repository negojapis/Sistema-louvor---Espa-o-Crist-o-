-- ==============================================================================
-- SISTEMA DE ESCALAS PARA MINISTÉRIO DE LOUVOR E CONDUÇÃO
-- Script de Inicialização PostgreSQL / Supabase
-- Com Row Level Security (RLS) Completo e Políticas de Acesso
-- ==============================================================================

-- 1. Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuário (Integrado com auth.users)
-- Somente quem tem role = 'admin' é pastor administrador.
-- Ter "Pastor" ou "Pastora" no nome NÃO concede privilégio administrativo.
-- Ser líder de ministério NÃO concede privilégio administrativo.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  member_id UUID,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabela de Integrantes (Membros da equipe, seus ministérios e funções)
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ministry TEXT NOT NULL DEFAULT 'Louvor' CHECK (ministry IN ('Louvor', 'Condução e Palavra', 'Multimídia', 'Outro')),
  roles TEXT[] NOT NULL DEFAULT '{}',
  email TEXT,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  is_leader BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Vincular a chave estrangeira de profiles -> members
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS fk_profiles_member,
  ADD CONSTRAINT fk_profiles_member 
  FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL;

-- 4. Tabela de Cultos e Calendário
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  period TEXT NOT NULL DEFAULT 'manha' CHECK (period IN ('manha', 'noite', 'outro')),
  service_type TEXT NOT NULL DEFAULT 'domingo_manha' CHECK (service_type IN ('domingo_manha', 'domingo_noite', 'sabado_jovens', 'outro')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Tabela de Disponibilidade por Culto
CREATE TABLE IF NOT EXISTS public.availabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('disponivel', 'indisponivel', 'pendente')),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unq_service_member_availability UNIQUE (service_id, member_id)
);

-- 6. Tabela de Submissões Mensais (Disponibilidade Mensal Consolidada)
-- Guarda a data de envio e a resposta do campo opcional de sugestão para servir em outra função
CREATE TABLE IF NOT EXISTS public.monthly_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Formato 'YYYY-MM' (ex: '2026-11')
  serve_other_suggestion TEXT,
  submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unq_member_month_submission UNIQUE (member_id, month)
);

-- 7. Tabela de Escala de Integrantes no Culto
-- Garante que uma pessoa não seja escalada duas vezes no mesmo culto
CREATE TABLE IF NOT EXISTS public.schedule_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  ministry_section TEXT NOT NULL DEFAULT 'louvor' CHECK (ministry_section IN ('louvor', 'multimidia', 'conducao')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unq_service_member_schedule UNIQUE (service_id, member_id)
);

-- 8. Tabela de Músicas do Culto (Repertório em ordem)
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  tone TEXT,
  link TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- FUNÇÕES AUXILIARES DE SEGURANÇA
-- ==============================================================================

-- Verifica se o usuário autenticado é Pastor Administrador (role = 'admin')
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Retorna o ID do integrante vinculado ao usuário autenticado atual
CREATE OR REPLACE FUNCTION public.get_current_member_id()
RETURNS UUID AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT member_id INTO v_member_id 
  FROM public.profiles 
  WHERE id = auth.uid();
  RETURN v_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- TRIGGER PARA CRIAR PERFIL AUTOMÁTICO NO SIGN UP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := 'member';
  v_count INT;
BEGIN
  -- Apenas o primeiro usuário do sistema vira admin por padrão
  SELECT COUNT(*) INTO v_count FROM public.profiles;
  IF v_count = 0 THEN
    v_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- HABILITAÇÃO DO ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- POLÍTICAS: PROFILES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: MEMBERS (Integrantes)
-- Integrantes: apenas visualização. Pastor Administrador: escrita total.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "members_select_policy" ON public.members;
CREATE POLICY "members_select_policy" ON public.members
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "members_admin_all" ON public.members;
CREATE POLICY "members_admin_all" ON public.members
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: SERVICES (Cultos)
-- Integrantes: visualização de cultos. Pastor Administrador: criação e edição.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "services_select_policy" ON public.services;
CREATE POLICY "services_select_policy" ON public.services
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "services_admin_all" ON public.services;
CREATE POLICY "services_admin_all" ON public.services
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: AVAILABILITIES (Disponibilidade)
-- Todos autenticados podem ver as respostas.
-- Cada integrante só pode criar/alterar a SUA PRÓPRIA disponibilidade.
-- Pastor Administrador pode alterar de qualquer pessoa se necessário.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "availabilities_select_policy" ON public.availabilities;
CREATE POLICY "availabilities_select_policy" ON public.availabilities
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "availabilities_insert_policy" ON public.availabilities;
CREATE POLICY "availabilities_insert_policy" ON public.availabilities
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR
    member_id = public.get_current_member_id() OR
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "availabilities_update_policy" ON public.availabilities;
CREATE POLICY "availabilities_update_policy" ON public.availabilities
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR
    member_id = public.get_current_member_id() OR
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin() OR
    member_id = public.get_current_member_id() OR
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

-- ------------------------------------------------------------------------------
-- POLÍTICAS: MONTHLY_SUBMISSIONS (Submissões Mensais & Sugestões)
-- Visualização: autenticados (para que o pastor veja as sugestões e envios).
-- Envio: integrante apenas para si mesmo, ou pastor admin.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "monthly_submissions_select" ON public.monthly_submissions;
CREATE POLICY "monthly_submissions_select" ON public.monthly_submissions
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "monthly_submissions_insert" ON public.monthly_submissions;
CREATE POLICY "monthly_submissions_insert" ON public.monthly_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR
    member_id = public.get_current_member_id() OR
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "monthly_submissions_update" ON public.monthly_submissions;
CREATE POLICY "monthly_submissions_update" ON public.monthly_submissions
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR
    member_id = public.get_current_member_id() OR
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin() OR
    member_id = public.get_current_member_id() OR
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

-- ------------------------------------------------------------------------------
-- POLÍTICAS: SCHEDULE_ASSIGNMENTS (Escala)
-- Integrantes visualizam APENAS escalas de cultos publicados!
-- Pastor Administrador visualiza rascunhos e publicadas, com controle total.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "schedule_select_policy" ON public.schedule_assignments;
CREATE POLICY "schedule_select_policy" ON public.schedule_assignments
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.services s 
      WHERE s.id = schedule_assignments.service_id 
      AND s.status = 'published'
    )
  );

DROP POLICY IF EXISTS "schedule_admin_all" ON public.schedule_assignments;
CREATE POLICY "schedule_admin_all" ON public.schedule_assignments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- POLÍTICAS: SONGS (Músicas / Repertório)
-- Integrantes visualizam músicas de cultos publicados.
-- Pastor Administrador cadastra, ordena e edita.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "songs_select_policy" ON public.songs;
CREATE POLICY "songs_select_policy" ON public.songs
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.services s 
      WHERE s.id = songs.service_id 
      AND s.status = 'published'
    )
  );

DROP POLICY IF EXISTS "songs_admin_all" ON public.songs;
CREATE POLICY "songs_admin_all" ON public.songs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- SEED INICIAL: CADASTRO DO MINISTÉRIO DE LOUVOR, CONDUÇÃO E MULTIMÍDIA
-- ==============================================================================
INSERT INTO public.members (name, ministry, roles, is_leader, active) VALUES
  ('Katia', 'Louvor', ARRAY['Voz'], FALSE, TRUE),
  ('Micehele', 'Louvor', ARRAY['Voz'], FALSE, TRUE),
  ('Ligia', 'Louvor', ARRAY['Voz'], FALSE, TRUE),
  ('Bea', 'Louvor', ARRAY['Voz'], FALSE, TRUE),
  ('Milena', 'Louvor', ARRAY['Voz'], FALSE, TRUE),
  ('Flávio', 'Louvor', ARRAY['Voz', 'Cajon'], FALSE, TRUE),
  ('Alex', 'Louvor', ARRAY['Violão', 'Bateria'], FALSE, TRUE),
  ('Vinicius', 'Louvor', ARRAY['Violão'], FALSE, TRUE),
  ('Paulo', 'Louvor', ARRAY['Violão', 'Baixo'], FALSE, TRUE),
  ('Alexandre', 'Louvor', ARRAY['Violão'], FALSE, TRUE),
  ('Gabriel', 'Louvor', ARRAY['Violão', 'Guitarra'], FALSE, TRUE),
  ('Eduardo', 'Louvor', ARRAY['Bateria'], FALSE, TRUE),
  ('Felipe', 'Louvor', ARRAY['Bateria'], FALSE, TRUE),
  ('Leticia', 'Louvor', ARRAY['Teclado'], FALSE, TRUE),
  ('Paula', 'Louvor', ARRAY['Teclado'], FALSE, TRUE),
  ('Pastor Junior', 'Condução e Palavra', ARRAY['Ministração e condução', 'Auxílio na voz'], FALSE, TRUE),
  ('Pastora Isis', 'Condução e Palavra', ARRAY['Ministração e condução', 'Auxílio na voz'], FALSE, TRUE),
  ('Pastora Miriam', 'Condução e Palavra', ARRAY['Ministração e condução'], FALSE, TRUE),
  ('Pastor Timoteo', 'Condução e Palavra', ARRAY['Palavra'], FALSE, TRUE),
  ('Pastor Kato', 'Condução e Palavra', ARRAY['Palavra'], FALSE, TRUE),
  ('Pastor Paulo', 'Condução e Palavra', ARRAY['Palavra'], FALSE, TRUE),
  ('Pastora Is', 'Condução e Palavra', ARRAY['Palavra'], FALSE, TRUE),
  ('Daniel', 'Multimídia', ARRAY['Som', 'Luz'], TRUE, TRUE),
  ('Rafael', 'Multimídia', ARRAY['Projeção'], FALSE, TRUE)
ON CONFLICT DO NOTHING;

