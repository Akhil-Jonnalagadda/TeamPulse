
CREATE OR REPLACE FUNCTION public.ensure_profile(_full_name text, _role public.app_role DEFAULT 'team_member', _team_name text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _email text; _team uuid; _exists boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = _uid) INTO _exists;
  IF _exists THEN RETURN; END IF;
  SELECT email INTO _email FROM auth.users WHERE id = _uid;
  SELECT id INTO _team FROM public.teams WHERE _team_name IS NOT NULL AND name = _team_name LIMIT 1;
  IF _team IS NULL THEN SELECT id INTO _team FROM public.teams ORDER BY created_at LIMIT 1; END IF;
  INSERT INTO public.profiles (id, email, full_name, employee_id, team_id, shift)
  VALUES (_uid, COALESCE(_email,'unknown'), _full_name, 'EMP-' || upper(substr(_uid::text,1,6)), _team, 'General');
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, _role) ON CONFLICT DO NOTHING;
END; $$;
REVOKE ALL ON FUNCTION public.ensure_profile(text, public.app_role, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ensure_profile(text, public.app_role, text) TO authenticated;
