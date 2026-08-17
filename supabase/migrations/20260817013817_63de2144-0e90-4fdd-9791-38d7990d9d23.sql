
UPDATE public.programs SET is_published = true WHERE name = 'M2F Forge';

DROP POLICY IF EXISTS "Users can view assigned programs" ON public.programs;
CREATE POLICY "Users can view assigned programs"
ON public.programs FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.program_assignments pa
  WHERE pa.program_id = programs.id AND pa.user_id = auth.uid()
));
