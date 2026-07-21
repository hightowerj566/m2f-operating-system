
-- 1. user_roles: only admins may insert/delete roles (prevents coach self-elevation)
DROP POLICY IF EXISTS "Coaches can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Coaches can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Coaches can view all roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Coaches and admins can view roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'coach'::app_role));

-- 2. client_invitations: remove token-visible SELECT policy, expose via SECURITY DEFINER RPC that
-- returns only when the exact token matches. Also drop generic UPDATE (accept-invitation edge
-- function uses service role).
DROP POLICY IF EXISTS "Anyone with token can read invitation" ON public.client_invitations;
DROP POLICY IF EXISTS "Accepter can mark invitation used" ON public.client_invitations;

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS TABLE (id uuid, email text, first_name text, role app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.email, i.first_name, i.role
  FROM public.client_invitations i
  WHERE i.token = _token
    AND i.accepted_at IS NULL
    AND i.expires_at > now()
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_invitation_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;

-- 3. programs: drop the "all authenticated can view" catch-all. Replace with a
-- policy that only exposes PUBLISHED programs so the picker still works but
-- draft/unpublished content stays private to coaches + assigned users.
DROP POLICY IF EXISTS "Authenticated users can view programs" ON public.programs;
CREATE POLICY "Authenticated users can view published programs"
  ON public.programs FOR SELECT TO authenticated
  USING (is_published = true);

-- 4. storage.exercise-videos: restrict SELECT to active subscribers and coaches
DROP POLICY IF EXISTS "Authenticated users can view exercise videos" ON storage.objects;
CREATE POLICY "Subscribers and coaches can view exercise videos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'exercise-videos'
    AND (
      public.has_role(auth.uid(), 'coach'::app_role)
      OR public.is_admin(auth.uid())
      OR public.has_active_subscription(auth.uid())
    )
  );

-- 5. Reduce SECURITY DEFINER exposure: revoke EXECUTE from anon on helpers that
-- never need to be called by unauthenticated users. Helpers used inside RLS
-- policies (has_role, is_admin, is_coach_or_admin) must stay executable by
-- authenticated because policies evaluate as the invoking role.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_coach_or_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_view_client(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.week_is_accessible(uuid, uuid) FROM anon, authenticated;
-- generate_scheduled_weeks is called via RPC by coach UI (with internal role check)
REVOKE EXECUTE ON FUNCTION public.generate_scheduled_weeks(uuid) FROM anon;
