
-- Fix user_roles: remove conflicting restrictive policies, use permissive coach-only insert
DROP POLICY IF EXISTS "Coaches can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users cannot modify roles" ON public.user_roles;

-- Only coaches can grant roles (permissive)
CREATE POLICY "Coaches can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'coach'::app_role));

-- Fix father_athlete_leads: remove open INSERT, restrict to coaches only (edge function uses service role)
DROP POLICY IF EXISTS "Anyone can submit quiz leads" ON public.father_athlete_leads;

CREATE POLICY "Coaches can insert leads"
  ON public.father_athlete_leads FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'coach'::app_role));
