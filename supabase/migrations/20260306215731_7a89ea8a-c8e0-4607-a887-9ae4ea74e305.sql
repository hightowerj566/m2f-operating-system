
-- Add notes column to workout_logs
ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS notes text;

-- Create exercise swaps table
CREATE TABLE public.user_exercise_swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
  original_exercise text NOT NULL,
  replacement_name text NOT NULL,
  replacement_detail text NOT NULL DEFAULT '',
  scope text NOT NULL DEFAULT 'workout',
  day_number integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_exercise_swaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own swaps" ON public.user_exercise_swaps
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can view swaps" ON public.user_exercise_swaps
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'coach'::app_role));
