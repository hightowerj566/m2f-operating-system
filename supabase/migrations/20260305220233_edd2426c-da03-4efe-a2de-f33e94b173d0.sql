
CREATE TABLE public.workout_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid NOT NULL REFERENCES programs(id),
  day_number integer NOT NULL,
  phase integer NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'moderate', 'hard', 'very_hard')),
  workout_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback" ON public.workout_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON public.workout_feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view all feedback" ON public.workout_feedback
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'coach'::app_role));

CREATE INDEX idx_workout_feedback_user_day ON workout_feedback(user_id, program_id, day_number);
