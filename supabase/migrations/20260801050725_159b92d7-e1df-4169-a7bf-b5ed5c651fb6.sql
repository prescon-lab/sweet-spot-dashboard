DROP VIEW IF EXISTS public.member_directory;

-- members may read profile rows, but email column access is revoked below
CREATE POLICY "Members view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_member(auth.uid()));

REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, full_name, avatar_url, guardian_name, created_at) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- admin-only email listing
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS TABLE (id uuid, email text, full_name text, avatar_url text, guardian_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.avatar_url, p.guardian_name
    FROM public.profiles p
    ORDER BY p.email;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles() TO authenticated;