
-- 1. Flag on programs
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS uses_live_schedule boolean NOT NULL DEFAULT false;

-- 2. Assignment enum + columns
DO $$ BEGIN
  CREATE TYPE public.assignment_status AS ENUM ('draft','scheduled','active','paused','completed','ended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.program_assignments
  ADD COLUMN IF NOT EXISTS scheduled_start_date date,
  ADD COLUMN IF NOT EXISTS scheduled_end_date   date,
  ADD COLUMN IF NOT EXISTS member_timezone      text NOT NULL DEFAULT 'America/Denver',
  ADD COLUMN IF NOT EXISTS status public.assignment_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS paused_at  timestamptz,
  ADD COLUMN IF NOT EXISTS resumed_at timestamptz;

-- 3. Scheduled program weeks
DO $$ BEGIN
  CREATE TYPE public.week_publish_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.week_access_status AS ENUM ('locked','unlocked','completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.scheduled_program_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.program_assignments(id) ON DELETE CASCADE,
  display_week_number int NOT NULL,
  start_date date NOT NULL,
  end_date   date NOT NULL,
  unlock_at  timestamptz NOT NULL,
  source_day_start int,
  source_day_end   int,
  publish_status public.week_publish_status NOT NULL DEFAULT 'published',
  access_status  public.week_access_status  NOT NULL DEFAULT 'locked',
  coach_notes text,
  member_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, display_week_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_program_weeks TO authenticated;
GRANT ALL ON public.scheduled_program_weeks TO service_role;

ALTER TABLE public.scheduled_program_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view accessible weeks"
ON public.scheduled_program_weeks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.program_assignments pa
    WHERE pa.id = scheduled_program_weeks.assignment_id
      AND pa.user_id = auth.uid()
  )
  AND unlock_at <= now()
  AND display_week_number >= (
    SELECT COALESCE(MAX(w.display_week_number),0) - 4
    FROM public.scheduled_program_weeks w
    WHERE w.assignment_id = scheduled_program_weeks.assignment_id
      AND w.unlock_at <= now()
  )
);

CREATE POLICY "Coaches manage all weeks"
ON public.scheduled_program_weeks FOR ALL
USING (public.has_role(auth.uid(),'coach'))
WITH CHECK (public.has_role(auth.uid(),'coach'));

CREATE TRIGGER scheduled_weeks_updated_at
BEFORE UPDATE ON public.scheduled_program_weeks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Change log
CREATE TABLE IF NOT EXISTS public.schedule_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.program_assignments(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL,
  field text NOT NULL,
  prev_value jsonb,
  new_value  jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.schedule_change_log TO authenticated;
GRANT ALL ON public.schedule_change_log TO service_role;

ALTER TABLE public.schedule_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage change log"
ON public.schedule_change_log FOR ALL
USING (public.has_role(auth.uid(),'coach'))
WITH CHECK (public.has_role(auth.uid(),'coach'));

CREATE POLICY "Members view own change log"
ON public.schedule_change_log FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.program_assignments pa
  WHERE pa.id = schedule_change_log.assignment_id
    AND pa.user_id = auth.uid()
));

-- 5. Link workout_logs to a scheduled week
ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS scheduled_week_id uuid REFERENCES public.scheduled_program_weeks(id) ON DELETE SET NULL;

-- 6. Helpers
CREATE OR REPLACE FUNCTION public.compute_week_unlock_at(_start date, _tz text)
RETURNS timestamptz
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN (_start::timestamp) AT TIME ZONE _tz;
END $$;

CREATE OR REPLACE FUNCTION public.generate_scheduled_weeks(_assignment_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a record;
  p record;
  wk int;
  weeks int;
  ws date;
  we date;
BEGIN
  SELECT * INTO a FROM public.program_assignments WHERE id = _assignment_id;
  IF a.scheduled_start_date IS NULL THEN RETURN; END IF;
  SELECT * INTO p FROM public.programs WHERE id = a.program_id;
  IF NOT p.uses_live_schedule THEN RETURN; END IF;

  weeks := GREATEST(1, CEIL(p.total_days::numeric / 7));

  DELETE FROM public.scheduled_program_weeks
   WHERE assignment_id = _assignment_id
     AND access_status <> 'completed';

  FOR wk IN 1..weeks LOOP
    ws := a.scheduled_start_date + ((wk - 1) * 7);
    we := ws + 6;
    INSERT INTO public.scheduled_program_weeks
      (assignment_id, display_week_number, start_date, end_date, unlock_at,
       source_day_start, source_day_end, publish_status, access_status)
    VALUES
      (_assignment_id, wk, ws, we,
       public.compute_week_unlock_at(ws, a.member_timezone),
       ((wk-1)*7)+1, wk*7,
       'published', 'locked')
    ON CONFLICT (assignment_id, display_week_number) DO NOTHING;
  END LOOP;

  UPDATE public.program_assignments
     SET scheduled_end_date = a.scheduled_start_date + (weeks * 7) - 1
   WHERE id = _assignment_id;
END $$;

CREATE OR REPLACE FUNCTION public.week_is_accessible(_week_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment uuid;
  v_member uuid;
  v_wk int;
  v_unlock timestamptz;
  v_max int;
BEGIN
  SELECT sw.assignment_id, pa.user_id, sw.display_week_number, sw.unlock_at
    INTO v_assignment, v_member, v_wk, v_unlock
    FROM public.scheduled_program_weeks sw
    JOIN public.program_assignments pa ON pa.id = sw.assignment_id
   WHERE sw.id = _week_id;

  IF v_assignment IS NULL OR v_member <> _user_id OR v_unlock > now() THEN
    RETURN false;
  END IF;

  SELECT COALESCE(MAX(sw2.display_week_number), 0)
    INTO v_max
    FROM public.scheduled_program_weeks sw2
   WHERE sw2.assignment_id = v_assignment
     AND sw2.unlock_at <= now();

  RETURN v_wk >= v_max - 4;
END $$;

-- Seed Forge and Rebuild as empty 12-week live-schedule shells
INSERT INTO public.programs (name, description, total_days, created_by, is_published, uses_live_schedule)
SELECT 'Forge', 'Live-schedule strength program. 12 weeks.', 84, 'bd99286f-3d70-4c19-81c5-bbf94a040c9a', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.programs WHERE name = 'Forge');

INSERT INTO public.programs (name, description, total_days, created_by, is_published, uses_live_schedule)
SELECT 'Rebuild', 'Live-schedule foundation program. 12 weeks.', 84, 'bd99286f-3d70-4c19-81c5-bbf94a040c9a', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.programs WHERE name = 'Rebuild');
