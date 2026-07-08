
-- Create max_history table for tracking 1RM estimates over time
CREATE TABLE public.max_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  weight_lbs NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.max_history ENABLE ROW LEVEL SECURITY;

-- Users can view own history
CREATE POLICY "Users can view own max history"
  ON public.max_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert own history
CREATE POLICY "Users can insert own max history"
  ON public.max_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Coaches can view all
CREATE POLICY "Coaches can view all max history"
  ON public.max_history FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'coach'::app_role));
