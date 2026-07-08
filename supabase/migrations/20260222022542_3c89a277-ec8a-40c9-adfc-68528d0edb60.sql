
-- 1. Create all tables first
CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  total_days integer NOT NULL DEFAULT 1,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.program_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  label text,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(program_id, day_number)
);

CREATE TABLE public.program_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  current_day integer NOT NULL DEFAULT 1,
  assigned_by uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);

-- 2. Enable RLS on all tables
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_assignments ENABLE ROW LEVEL SECURITY;

-- 3. Policies for programs
CREATE POLICY "Coaches can manage programs"
  ON public.programs FOR ALL
  USING (has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Users can view assigned programs"
  ON public.programs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.program_assignments pa
      WHERE pa.program_id = programs.id AND pa.user_id = auth.uid()
    )
  );

-- 4. Policies for program_days
CREATE POLICY "Coaches can manage program days"
  ON public.program_days FOR ALL
  USING (has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Users can view assigned program days"
  ON public.program_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.program_assignments pa
      WHERE pa.program_id = program_days.program_id AND pa.user_id = auth.uid()
    )
  );

-- 5. Policies for program_assignments
CREATE POLICY "Coaches can manage assignments"
  ON public.program_assignments FOR ALL
  USING (has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Users can view own assignments"
  ON public.program_assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own current day"
  ON public.program_assignments FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Triggers
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_program_assignments_updated_at BEFORE UPDATE ON public.program_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Storage bucket for exercise demo videos
INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-videos', 'exercise-videos', true);

CREATE POLICY "Coaches can upload videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'exercise-videos' AND has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Coaches can update videos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'exercise-videos' AND has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Coaches can delete videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'exercise-videos' AND has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Anyone can view exercise videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exercise-videos');
