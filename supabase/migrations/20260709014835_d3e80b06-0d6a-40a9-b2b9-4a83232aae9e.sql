
CREATE TABLE public.learn_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_slug text NOT NULL,
  completed_at timestamptz,
  saved boolean NOT NULL DEFAULT false,
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.learn_progress TO authenticated;
GRANT ALL ON public.learn_progress TO service_role;

ALTER TABLE public.learn_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own learn progress"
  ON public.learn_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_learn_progress_updated_at
  BEFORE UPDATE ON public.learn_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX learn_progress_user_idx ON public.learn_progress (user_id);
CREATE INDEX learn_progress_user_recent_idx ON public.learn_progress (user_id, last_viewed_at DESC);
