DROP POLICY IF EXISTS "Users can insert own assignments" ON public.program_assignments;

CREATE POLICY "Users can insert own assignments"
ON public.program_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND assigned_by = auth.uid()
);