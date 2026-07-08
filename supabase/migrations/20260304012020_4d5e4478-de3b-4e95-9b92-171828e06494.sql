
-- Allow all authenticated users to view programs (needed for program picker)
CREATE POLICY "Authenticated users can view programs"
ON public.programs
FOR SELECT
TO authenticated
USING (true);
