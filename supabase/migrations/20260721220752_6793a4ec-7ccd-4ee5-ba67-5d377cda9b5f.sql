
-- Restore EXECUTE on has_active_subscription so RLS policies that reference it
-- (e.g. exercise-videos storage) can evaluate under the authenticated role.
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;

-- Defensive: ensure key user-facing tables are reachable through the Data API.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_assignments TO authenticated;
GRANT ALL ON public.program_assignments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_program_weeks TO authenticated;
GRANT ALL ON public.scheduled_program_weeks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_invitations TO authenticated;
GRANT ALL ON public.client_invitations TO service_role;

-- Allow coaches/admins to update (revoke) the invitations they created.
DROP POLICY IF EXISTS "Coaches and admins can update own invitations" ON public.client_invitations;
CREATE POLICY "Coaches and admins can update own invitations"
  ON public.client_invitations FOR UPDATE TO authenticated
  USING (invited_by = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (invited_by = auth.uid() OR public.is_admin(auth.uid()));
