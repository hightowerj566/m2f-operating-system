
CREATE TABLE public.workout_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  phase TEXT,
  week INTEGER,
  day TEXT,
  block TEXT,
  exercise TEXT NOT NULL,
  sets INTEGER,
  reps TEXT,
  tempo TEXT,
  rest_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout programs" ON public.workout_programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout programs" ON public.workout_programs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout programs" ON public.workout_programs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Coaches can view all workout programs" ON public.workout_programs FOR SELECT USING (has_role(auth.uid(), 'coach'::app_role));
