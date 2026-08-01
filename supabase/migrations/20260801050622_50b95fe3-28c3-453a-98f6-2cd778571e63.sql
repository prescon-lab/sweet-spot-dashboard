-- helper: is caller a registered member (has a profile row)
CREATE OR REPLACE FUNCTION public.is_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id)
$$;

REVOKE ALL ON FUNCTION public.is_member(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- notifications
DROP POLICY IF EXISTS "Authenticated can access notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- profiles
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- non-sensitive directory view (no email)
CREATE OR REPLACE VIEW public.member_directory
WITH (security_invoker = off) AS
  SELECT id, full_name, avatar_url, guardian_name FROM public.profiles;
REVOKE ALL ON public.member_directory FROM PUBLIC, anon;
GRANT SELECT ON public.member_directory TO authenticated;

-- user_roles
DROP POLICY IF EXISTS "Authenticated can view roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- squads
DROP POLICY IF EXISTS "Authenticated can access squads" ON public.squads;
CREATE POLICY "Members view squads" ON public.squads
  FOR SELECT TO authenticated USING (public.is_member(auth.uid()));
CREATE POLICY "Admins manage squads" ON public.squads
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- squad_members
DROP POLICY IF EXISTS "Authenticated can access squad members" ON public.squad_members;
CREATE POLICY "Members view squad members" ON public.squad_members
  FOR SELECT TO authenticated USING (public.is_member(auth.uid()));
CREATE POLICY "Admins manage squad members" ON public.squad_members
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- app_data
DROP POLICY IF EXISTS "Authenticated can access app_data" ON public.app_data;
CREATE POLICY "Members view app_data" ON public.app_data
  FOR SELECT TO authenticated USING (public.is_member(auth.uid()));
CREATE POLICY "Members insert app_data" ON public.app_data
  FOR INSERT TO authenticated WITH CHECK (public.is_member(auth.uid()));
CREATE POLICY "Members update app_data" ON public.app_data
  FOR UPDATE TO authenticated USING (public.is_member(auth.uid()))
  WITH CHECK (public.is_member(auth.uid()));
CREATE POLICY "Admins delete app_data" ON public.app_data
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));