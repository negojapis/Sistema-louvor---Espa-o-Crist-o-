-- ==============================================================================
-- SISTEMA DE ESCALAS — ESPAÇO CRISTÃO
-- MIGRAÇÃO DE BANCO EXISTENTE PARA CORREÇÕES DE SEGURANÇA E RLS
-- ==============================================================================
-- Esta migração aplica todas as correções de integridade, RLS e atomicidade
-- sem apagar nenhum dado existente de cultos, integrantes ou escalas.
-- Execute no Supabase SQL Editor.
-- ==============================================================================

-- 1. Remover regra que torna o primeiro usuário cadastrado em administrador por padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Todos os novos usuários entram como integrantes ('member').
  -- O Pastor Administrador deve ser promovido explicitamente no SQL Editor.
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

-- 2. Proteger campos administrativos de profiles (role e member_id)
-- Um integrante não pode se auto-promover nem trocar seu vínculo
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

-- 3. Sincronizar vínculo profiles.member_id com members.user_id
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

-- 3.1 Sincronizar automaticamente quando o pastor cadastra ou edita o e-mail do integrante
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

-- 4. Restringir leitura de disponibilidades e submissões mensais ao próprio integrante e ao pastor
DROP POLICY IF EXISTS "availabilities_select_policy" ON public.availabilities;
CREATE POLICY "availabilities_select_policy" ON public.availabilities
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    member_id = public.get_current_member_id() OR
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "monthly_submissions_select" ON public.monthly_submissions;
CREATE POLICY "monthly_submissions_select" ON public.monthly_submissions
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    member_id = public.get_current_member_id() OR
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

-- 5. Função atômica para submissão mensal de disponibilidade
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
  -- Se for admin e especificou um integrante, permite salvar para ele
  IF public.is_admin() AND p_target_member_id IS NOT NULL THEN
    v_member_id := p_target_member_id;
  ELSE
    -- Descobre o integrante do usuário autenticado de forma confiável
    v_member_id := public.get_current_member_id();
    IF v_member_id IS NULL THEN
      SELECT id INTO v_member_id FROM public.members WHERE user_id = auth.uid();
    END IF;
  END IF;

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não vinculado a um integrante cadastrado.';
  END IF;

  -- Grava as disponibilidades por culto
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

  -- Grava submissão mensal consolidada com observações/sugestões
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

-- 6. Função atômica para salvar escalas sem risco de perda de dados
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

  -- Remove escala anterior do culto
  DELETE FROM public.schedule_assignments WHERE service_id = p_service_id;

  -- Insere novas atribuições
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

  -- Atualiza status de publicação se especificado
  IF p_publish IS NOT NULL THEN
    UPDATE public.services
    SET status = CASE WHEN p_publish THEN 'published' ELSE 'draft' END
    WHERE id = p_service_id;
  END IF;

  RETURN jsonb_build_object('success', TRUE, 'service_id', p_service_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder execução aos usuários autenticados
GRANT EXECUTE ON FUNCTION public.submit_monthly_availability(TEXT, JSONB, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_service_schedule(UUID, JSONB, BOOLEAN) TO authenticated;
