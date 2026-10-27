-- ==============================================================================
-- SISTEMA DE ESCALAS PARA MINISTÉRIO DE LOUVOR E CONDUÇÃO — ESPAÇO CRISTÃO
-- Script de Inicialização PostgreSQL / Supabase
-- Com Row Level Security (RLS) Completo, Funções Atômicas e Políticas de Acesso
-- ==============================================================================

-- 1. Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuário (Integrado com auth.users)
-- Somente quem tem role = 'admin' é pastor administrador.
-- Ter "Pastor", "Pastora" ou "Líder" no nome NÃO concede privilégio administrativo.
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
-- TRIGGERS DE SEGURANÇA E INTEGRIDADE
-- ==============================================================================

-- Trigger para criar perfil de novo usuário sempre como 'member' (sem auto-admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'member'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Proteger campos administrativos de profiles (role e member_id)
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Apenas o pastor administrador tem permissão para alterar a função (role).';
    END IF;
    IF NEW.member_id IS DISTINCT FROM OLD.member_id THEN
      RAISE EXCEPTION 'Apenas o pastor administrador tem permissão para alterar o vínculo de integrante (member_id).';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- Sincronizar vínculo profiles.member_id com members.user_id
CREATE OR REPLACE FUNCTION public.sync_profile_member_link()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.member_id IS NOT NULL AND (OLD.member_id IS NULL OR NEW.member_id <> OLD.member_id) THEN
    UPDATE public.members SET user_id = NEW.id WHERE id = NEW.member_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_profile_member_link ON public.profiles;
CREATE TRIGGER trg_sync_profile_member_link
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_member_link();

-- Sincronizar automaticamente quando o pastor cadastra ou edita o e-mail do integrante
CREATE OR REPLACE FUNCTION public.sync_member_by_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
    UPDATE public.profiles
    SET member_id = NEW.id
    WHERE LOWER(email) = LOWER(NEW.email) AND (member_id IS NULL OR member_id <> NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_member_by_email ON public.members;
CREATE TRIGGER trg_sync_member_by_email
  AFTER INSERT OR UPDATE OF email ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.sync_member_by_email();

-- ==============================================================================
-- FUNÇÕES ATÔMICAS (RPC)
-- ==============================================================================

-- Salva disponibilidade mensal em transação única
CREATE OR REPLACE FUNCTION public.submit_monthly_availability(
  p_month TEXT,
  p_statuses JSONB,
  p_suggestion TEXT DEFAULT NULL,
  p_target_member_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_member_id UUID;
  v_service_id UUID;
  v_status TEXT;
  v_key TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF public.is_admin() AND p_target_member_id IS NOT NULL THEN
    v_member_id := p_target_member_id;
  ELSE
    v_member_id := public.get_current_member_id();
    IF v_member_id IS NULL THEN
      SELECT id INTO v_member_id FROM public.members WHERE user_id = auth.uid();
    END IF;
  END IF;

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não vinculado a um integrante cadastrado.';
  END IF;

  FOR v_key, v_status IN SELECT * FROM jsonb_each_text(p_statuses)
  LOOP
    v_service_id := v_key::UUID;
    IF v_status IN ('disponivel', 'indisponivel') THEN
      INSERT INTO public.availabilities (service_id, member_id, status, updated_at)
      VALUES (v_service_id, v_member_id, v_status, v_now)
      ON CONFLICT (service_id, member_id)
      DO UPDATE SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at;
    ELSIF v_status = 'pendente' THEN
      DELETE FROM public.availabilities WHERE service_id = v_service_id AND member_id = v_member_id;
    END IF;
  END LOOP;

  INSERT INTO public.monthly_submissions (member_id, month, serve_other_suggestion, submitted_at, updated_at)
  VALUES (v_member_id, p_month, p_suggestion, v_now, v_now)
  ON CONFLICT (member_id, month)
  DO UPDATE SET
    serve_other_suggestion = EXCLUDED.serve_other_suggestion,
    submitted_at = EXCLUDED.submitted_at,
    updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object('success', TRUE, 'member_id', v_member_id, 'month', p_month);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Salva escala de culto em transação única (nunca perde dados anteriores em caso de erro)
CREATE OR REPLACE FUNCTION public.save_service_schedule(
  p_service_id UUID,
  p_assignments JSONB,
  p_publish BOOLEAN DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_item JSONB;
  v_idx INT := 1;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas o pastor administrador pode montar ou alterar escalas.';
  END IF;

  DELETE FROM public.schedule_assignments WHERE service_id = p_service_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_assignments)
  LOOP
    INSERT INTO public.schedule_assignments (
      service_id,
      member_id,
      role_name,
      order_index,
      ministry_section
    ) VALUES (
      p_service_id,
      (v_item->>'member_id')::UUID,
      v_item->>'role_name',
      COALESCE((v_item->>'order_index')::INT, v_idx),
      COALESCE(v_item->>'ministry_section', 'louvor')
    );
    v_idx := v_idx + 1;
  END LOOP;

  IF p_publish IS NOT NULL THEN
    UPDATE public.services
    SET status = CASE WHEN p_publish THEN 'published' ELSE 'draft' END
    WHERE id = p_service_id;
  END IF;

  RETURN jsonb_build_object('success', TRUE, 'service_id', p_service_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "availabilities_select_policy" ON public.availabilities;
CREATE POLICY "availabilities_select_policy" ON public.availabilities
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    member_id = public.get_current_member_id() OR
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

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
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "monthly_submissions_select" ON public.monthly_submissions;
CREATE POLICY "monthly_submissions_select" ON public.monthly_submissions
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    member_id = public.get_current_member_id() OR
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

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

-- Conceder permissões de execução
GRANT EXECUTE ON FUNCTION public.submit_monthly_availability(TEXT, JSONB, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_service_schedule(UUID, JSONB, BOOLEAN) TO authenticated;

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
