
-- Allow coaches to insert roles for other users
CREATE POLICY "Coaches can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'coach'::app_role));

-- Allow coaches to delete roles
CREATE POLICY "Coaches can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'coach'::app_role));

-- Allow coaches to view all roles
CREATE POLICY "Coaches can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'coach'::app_role));
