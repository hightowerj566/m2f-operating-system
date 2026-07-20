
-- Migrate existing 'user' role rows to 'client'
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'client'::app_role FROM public.user_roles WHERE role = 'user'
ON CONFLICT (user_id, role) DO NOTHING;
DELETE FROM public.user_roles WHERE role = 'user';

-- Seed first admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('bd99286f-3d70-4c19-81c5-bbf94a040c9a', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Make sure the admin also has client role for regular app access
INSERT INTO public.user_roles (user_id, role)
VALUES ('bd99286f-3d70-4c19-81c5-bbf94a040c9a', 'client')
ON CONFLICT (user_id, role) DO NOTHING;

-- Add assigned_coach_id on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assigned_coach_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_assigned_coach_id_idx ON public.profiles(assigned_coach_id);

-- Replace handle_new_user: no default role. Roles come from invitation acceptance.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') $$;

CREATE OR REPLACE FUNCTION public.is_coach_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('coach','admin')) $$;

CREATE OR REPLACE FUNCTION public.can_view_client(_client_id uuid, _viewer_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    _client_id = _viewer_id
    OR public.is_admin(_viewer_id)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = _client_id AND p.assigned_coach_id = _viewer_id
    )
$$;

-- Invitations table
CREATE TABLE IF NOT EXISTS public.client_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text,
  role app_role NOT NULL DEFAULT 'client',
  token text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_coach_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_invitations_email_idx ON public.client_invitations(lower(email));
CREATE INDEX IF NOT EXISTS client_invitations_invited_by_idx ON public.client_invitations(invited_by);

GRANT SELECT, INSERT, UPDATE ON public.client_invitations TO authenticated;
GRANT SELECT ON public.client_invitations TO anon;
GRANT ALL ON public.client_invitations TO service_role;

ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;

-- Coach/Admin can create; admin can invite any role, coach can only invite 'client'
CREATE POLICY "Coaches and admins can create invitations"
  ON public.client_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND (
      public.is_admin(auth.uid())
      OR (public.has_role(auth.uid(), 'coach') AND role = 'client')
    )
  );

-- Coaches see their own invitations; admins see all
CREATE POLICY "Coaches see own invitations, admins see all"
  ON public.client_invitations FOR SELECT
  TO authenticated
  USING (invited_by = auth.uid() OR public.is_admin(auth.uid()));

-- Public token lookup for acceptance flow (anon needs this before signup)
CREATE POLICY "Anyone with token can read invitation"
  ON public.client_invitations FOR SELECT
  TO anon, authenticated
  USING (accepted_at IS NULL AND expires_at > now());

-- Invitees mark as accepted via edge function using service role; also allow the
-- newly-signed-in user to mark their own invitation accepted.
CREATE POLICY "Accepter can mark invitation used"
  ON public.client_invitations FOR UPDATE
  TO authenticated
  USING (accepted_at IS NULL AND expires_at > now())
  WITH CHECK (accepted_by = auth.uid());

CREATE TRIGGER update_client_invitations_updated_at
  BEFORE UPDATE ON public.client_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
