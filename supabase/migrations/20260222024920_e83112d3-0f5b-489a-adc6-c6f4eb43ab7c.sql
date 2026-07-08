
-- Create daily check-ins table for macro compliance tracking
CREATE TABLE public.daily_check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  compliance TEXT NOT NULL CHECK (compliance IN ('at', 'above', 'below')),
  actual_calories INTEGER,
  actual_protein_g INTEGER,
  actual_carbs_g INTEGER,
  actual_fat_g INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, check_date)
);

-- Enable RLS
ALTER TABLE public.daily_check_ins ENABLE ROW LEVEL SECURITY;

-- Users can manage their own check-ins
CREATE POLICY "Users can view own check-ins"
  ON public.daily_check_ins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins"
  ON public.daily_check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check-ins"
  ON public.daily_check_ins FOR UPDATE
  USING (auth.uid() = user_id);

-- Coaches can view all check-ins
CREATE POLICY "Coaches can view all check-ins"
  ON public.daily_check_ins FOR SELECT
  USING (has_role(auth.uid(), 'coach'::app_role));
