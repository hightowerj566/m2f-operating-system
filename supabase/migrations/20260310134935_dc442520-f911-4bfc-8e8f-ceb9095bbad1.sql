
-- Add publishing controls to programs
ALTER TABLE public.programs ADD COLUMN is_published boolean NOT NULL DEFAULT true;
ALTER TABLE public.programs ADD COLUMN published_through_day integer DEFAULT NULL;

-- Update RLS: Users can only view PUBLISHED assigned programs
DROP POLICY IF EXISTS "Users can view assigned programs" ON public.programs;
CREATE POLICY "Users can view assigned programs" ON public.programs
FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM program_assignments pa
    WHERE pa.program_id = programs.id AND pa.user_id = auth.uid()
  )
  AND is_published = true
);

-- Update program_days RLS: Users can only see days up to published_through_day
DROP POLICY IF EXISTS "Users can view assigned program days" ON public.program_days;
CREATE POLICY "Users can view assigned program days" ON public.program_days
FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM program_assignments pa
    WHERE pa.program_id = program_days.program_id AND pa.user_id = auth.uid()
  )
  AND (
    -- If program has no published_through_day limit, show all days
    NOT EXISTS (
      SELECT 1 FROM programs p
      WHERE p.id = program_days.program_id AND p.published_through_day IS NOT NULL
    )
    OR
    -- Otherwise only show days up to the limit
    program_days.day_number <= (
      SELECT p.published_through_day FROM programs p WHERE p.id = program_days.program_id
    )
  )
);
