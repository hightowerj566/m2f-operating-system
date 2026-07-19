CREATE TYPE public.check_in_status AS ENUM ('draft','submitted','in_review','response_ready','acknowledged','closed');
CREATE TYPE public.priority_category AS ENUM ('fitness','nutrition','relationship','fatherhood');
CREATE TYPE public.priority_status AS ENUM ('not_started','in_progress','completed','overdue','verified','carried_forward','not_applicable');
CREATE TYPE public.coaching_flag_severity AS ENUM ('critical','medium','info');
CREATE TYPE public.coaching_flag_status AS ENUM ('open','reviewing','resolved','dismissed');

CREATE TABLE public.weekly_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id uuid,
  week_start date NOT NULL,
  status public.check_in_status NOT NULL DEFAULT 'draft',
  overall_rating int CHECK (overall_rating BETWEEN 1 AND 10),
  biggest_win text,
  biggest_struggle text,
  energy_rating int CHECK (energy_rating BETWEEN 1 AND 5),
  stress_rating int CHECK (stress_rating BETWEEN 1 AND 5),
  sleep_range text,
  training_rating text,
  training_notes text,
  nutrition_rating text,
  nutrition_notes text,
  relationship_rating int CHECK (relationship_rating BETWEEN 1 AND 5),
  relationship_notes text,
  fatherhood_confidence int CHECK (fatherhood_confidence BETWEEN 1 AND 10),
  fatherhood_task_notes text,
  next_week_concern text,
  support_type text,
  support_notes text,
  submitted_at timestamptz,
  review_started_at timestamptz,
  response_sent_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_check_ins TO authenticated;
GRANT ALL ON public.weekly_check_ins TO service_role;
ALTER TABLE public.weekly_check_ins ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.weekly_check_in_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id uuid NOT NULL UNIQUE REFERENCES public.weekly_check_ins(id) ON DELETE CASCADE,
  workouts_scheduled int,
  workouts_completed int,
  workout_compliance_pct numeric,
  nutrition_days_logged int,
  nutrition_compliance_pct numeric,
  avg_calories numeric,
  avg_protein_g numeric,
  weekly_avg_weight numeric,
  previous_week_avg_weight numeric,
  weight_change numeric,
  readiness_score numeric,
  previous_readiness_score numeric,
  readiness_delta numeric,
  standards_completion_pct numeric,
  build_tasks_completed int,
  lessons_completed int,
  mission_completed boolean,
  days_until_due int,
  baby_age_days int,
  phase_slug text,
  program_id uuid,
  snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_check_in_snapshots TO authenticated;
GRANT ALL ON public.weekly_check_in_snapshots TO service_role;
ALTER TABLE public.weekly_check_in_snapshots ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.coach_weekly_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id uuid NOT NULL UNIQUE REFERENCES public.weekly_check_ins(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL,
  written_response text,
  video_url text,
  video_storage_path text,
  video_duration_seconds int,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent')),
  draft_saved_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_weekly_responses TO authenticated;
GRANT ALL ON public.coach_weekly_responses TO service_role;
ALTER TABLE public.coach_weekly_responses ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.weekly_priorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id uuid REFERENCES public.weekly_check_ins(id) ON DELETE SET NULL,
  response_id uuid REFERENCES public.coach_weekly_responses(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL,
  week_start date NOT NULL,
  category public.priority_category NOT NULL,
  title text NOT NULL,
  description text,
  completion_criteria text,
  due_date date,
  linked_entity_type text,
  linked_entity_id text,
  status public.priority_status NOT NULL DEFAULT 'not_started',
  na_reason text,
  completed_at timestamptz,
  coach_verified_at timestamptz,
  coach_note text,
  carried_from_priority_id uuid REFERENCES public.weekly_priorities(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start, category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_priorities TO authenticated;
GRANT ALL ON public.weekly_priorities TO service_role;
ALTER TABLE public.weekly_priorities ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.coaching_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_id uuid REFERENCES public.weekly_check_ins(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  flag_type text NOT NULL,
  severity public.coaching_flag_severity NOT NULL,
  title text NOT NULL,
  explanation text NOT NULL,
  source text NOT NULL DEFAULT 'rule_engine',
  status public.coaching_flag_status NOT NULL DEFAULT 'open',
  coach_note text,
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start, flag_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coaching_flags TO authenticated;
GRANT ALL ON public.coaching_flags TO service_role;
ALTER TABLE public.coaching_flags ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_wci_user_week ON public.weekly_check_ins (user_id, week_start DESC);
CREATE INDEX idx_wci_status ON public.weekly_check_ins (status, week_start DESC);
CREATE INDEX idx_wp_user_week ON public.weekly_priorities (user_id, week_start DESC);
CREATE INDEX idx_cf_status ON public.coaching_flags (status, severity);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_wci_updated BEFORE UPDATE ON public.weekly_check_ins FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cwr_updated BEFORE UPDATE ON public.coach_weekly_responses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_wp_updated BEFORE UPDATE ON public.weekly_priorities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cf_updated BEFORE UPDATE ON public.coaching_flags FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Members view own check-ins" ON public.weekly_check_ins
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'coach'));
CREATE POLICY "Members create own check-ins" ON public.weekly_check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members edit own unlocked check-ins" ON public.weekly_check_ins
  FOR UPDATE USING (
    (auth.uid() = user_id AND review_started_at IS NULL AND status IN ('draft','submitted','response_ready'))
    OR public.has_role(auth.uid(),'coach')
  );

CREATE POLICY "View snapshots" ON public.weekly_check_in_snapshots
  FOR SELECT USING (
    public.has_role(auth.uid(),'coach')
    OR EXISTS (SELECT 1 FROM public.weekly_check_ins c WHERE c.id = check_in_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Members insert own snapshot" ON public.weekly_check_in_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.weekly_check_ins c WHERE c.id = check_in_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Coaches manage responses" ON public.coach_weekly_responses
  FOR ALL USING (public.has_role(auth.uid(),'coach')) WITH CHECK (public.has_role(auth.uid(),'coach'));
CREATE POLICY "Members read sent responses" ON public.coach_weekly_responses
  FOR SELECT USING (
    status = 'sent' AND EXISTS (SELECT 1 FROM public.weekly_check_ins c WHERE c.id = check_in_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Coaches manage priorities" ON public.weekly_priorities
  FOR ALL USING (public.has_role(auth.uid(),'coach')) WITH CHECK (public.has_role(auth.uid(),'coach'));
CREATE POLICY "Members read own priorities" ON public.weekly_priorities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Members update own priority completion" ON public.weekly_priorities
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND coach_verified_at IS NULL);

CREATE POLICY "Coaches manage flags" ON public.coaching_flags
  FOR ALL USING (public.has_role(auth.uid(),'coach')) WITH CHECK (public.has_role(auth.uid(),'coach'));
CREATE POLICY "Members insert own flags" ON public.coaching_flags
  FOR INSERT WITH CHECK (auth.uid() = user_id AND source = 'rule_engine');

CREATE POLICY "Coaches upload response videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'coach-response-videos' AND public.has_role(auth.uid(),'coach'));
CREATE POLICY "Coaches manage response videos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'coach-response-videos' AND public.has_role(auth.uid(),'coach'));
CREATE POLICY "Coaches delete response videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'coach-response-videos' AND public.has_role(auth.uid(),'coach'));
CREATE POLICY "Members read own response videos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'coach-response-videos'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'coach'))
  );
