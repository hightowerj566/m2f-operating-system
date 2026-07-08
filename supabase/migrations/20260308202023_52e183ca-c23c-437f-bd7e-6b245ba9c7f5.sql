
-- Daily standards tracking table
CREATE TABLE public.daily_standards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  standard_date DATE NOT NULL DEFAULT CURRENT_DATE,
  wake_on_time BOOLEAN NOT NULL DEFAULT false,
  workout_completed BOOLEAN NOT NULL DEFAULT false,
  protein_hit BOOLEAN NOT NULL DEFAULT false,
  steps_hit BOOLEAN NOT NULL DEFAULT false,
  scripture_read BOOLEAN NOT NULL DEFAULT false,
  family_time BOOLEAN NOT NULL DEFAULT false,
  no_phone_at_dinner BOOLEAN NOT NULL DEFAULT false,
  hydration_hit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, standard_date)
);

-- RLS
ALTER TABLE public.daily_standards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own standards" ON public.daily_standards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own standards" ON public.daily_standards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own standards" ON public.daily_standards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Coaches can view all standards" ON public.daily_standards FOR SELECT USING (has_role(auth.uid(), 'coach'::app_role));
