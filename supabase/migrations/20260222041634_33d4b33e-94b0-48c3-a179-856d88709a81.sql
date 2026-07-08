
-- Table to log weekly macro adjustment recommendations and outcomes
CREATE TABLE public.macro_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  coach_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Inputs
  last_week_avg_weight NUMERIC NOT NULL,
  this_week_avg_weight NUMERIC NOT NULL,
  goal_rate_lb_per_week NUMERIC NOT NULL,
  avg_daily_calories INTEGER NOT NULL,
  current_protein_g INTEGER NOT NULL,
  current_carbs_g INTEGER NOT NULL,
  current_fat_g INTEGER NOT NULL,
  compliance_pct NUMERIC NOT NULL DEFAULT 0,
  days_tracked INTEGER NOT NULL DEFAULT 0,

  -- Computed
  actual_rate_lb_per_week NUMERIC NOT NULL,
  rate_error_lb NUMERIC NOT NULL,
  rate_error_g NUMERIC NOT NULL,
  energy_error_kcal_week NUMERIC NOT NULL,
  energy_error_kcal_day NUMERIC NOT NULL,
  suggested_calorie_change INTEGER NOT NULL,
  suggested_calories INTEGER NOT NULL,
  suggested_protein_g INTEGER NOT NULL,
  suggested_carbs_g INTEGER NOT NULL,
  suggested_fat_g INTEGER NOT NULL,

  -- Outcome
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, overridden, deferred
  applied_calories INTEGER,
  applied_protein_g INTEGER,
  applied_carbs_g INTEGER,
  applied_fat_g INTEGER,
  defer_reason TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- User explanation
  explanation TEXT
);

-- Enable RLS
ALTER TABLE public.macro_adjustments ENABLE ROW LEVEL SECURITY;

-- Coaches can do everything
CREATE POLICY "Coaches can manage adjustments"
  ON public.macro_adjustments
  FOR ALL
  USING (has_role(auth.uid(), 'coach'::app_role));

-- Users can view own adjustments
CREATE POLICY "Users can view own adjustments"
  ON public.macro_adjustments
  FOR SELECT
  USING (auth.uid() = user_id);
