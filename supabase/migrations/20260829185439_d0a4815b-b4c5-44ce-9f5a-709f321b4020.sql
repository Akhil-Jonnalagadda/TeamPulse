
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.my_team_id() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.team_of(uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_view_user(uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_profile(text, public.app_role, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ensure_profile(text, public.app_role, text) TO authenticated;
