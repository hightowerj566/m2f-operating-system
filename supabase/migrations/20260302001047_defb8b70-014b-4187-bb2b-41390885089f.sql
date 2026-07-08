
-- Add is_active flag to program_assignments to support program switching with progress preservation
ALTER TABLE public.program_assignments ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Create index for fast lookups of active assignments
CREATE INDEX idx_program_assignments_active ON public.program_assignments (user_id, is_active) WHERE is_active = true;

-- Allow users to insert their own assignments (for self-enrollment via program picker)
CREATE POLICY "Users can insert own assignments"
ON public.program_assignments
FOR INSERT
WITH CHECK (auth.uid() = user_id);
