ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coaching_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS coaching_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS coaching_status_changed_at timestamptz;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_coaching_status_chk
  CHECK (coaching_status IN ('none','active','paused','ended'));

UPDATE public.profiles p SET coaching_status = 'active',
  coaching_started_at = COALESCE(p.coaching_started_at, now()),
  coaching_status_changed_at = now()
WHERE p.assigned_coach_id IS NOT NULL
   OR EXISTS (SELECT 1 FROM public.client_invitations i WHERE i.accepted_by = p.user_id);

CREATE OR REPLACE FUNCTION public.has_active_coaching(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND coaching_status = 'active')
$$;
GRANT EXECUTE ON FUNCTION public.has_active_coaching(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.guard_coaching_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_coach_or_admin(auth.uid()) AND (
       NEW.coaching_status IS DISTINCT FROM OLD.coaching_status
    OR NEW.coaching_started_at IS DISTINCT FROM OLD.coaching_started_at
    OR NEW.coaching_status_changed_at IS DISTINCT FROM OLD.coaching_status_changed_at
    OR NEW.assigned_coach_id IS DISTINCT FROM OLD.assigned_coach_id) THEN
    RAISE EXCEPTION 'not authorized to change coaching status';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_coaching_columns BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_coaching_columns();

CREATE OR REPLACE FUNCTION public.guard_checkin_coaching()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_coach_or_admin(auth.uid())
     AND NOT public.has_active_coaching(NEW.user_id) THEN
    RAISE EXCEPTION '1:1 coaching is not active';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_checkin_coaching BEFORE INSERT OR UPDATE ON public.weekly_check_ins
  FOR EACH ROW EXECUTE FUNCTION public.guard_checkin_coaching();

CREATE OR REPLACE FUNCTION public.guard_coach_output()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_client uuid;
BEGIN
  IF TG_TABLE_NAME = 'coach_weekly_responses' THEN
    SELECT user_id INTO v_client FROM public.weekly_check_ins WHERE id = NEW.check_in_id;
  ELSE
    v_client := NEW.user_id;
  END IF;
  IF NOT public.has_active_coaching(v_client) THEN
    RAISE EXCEPTION '1:1 coaching is not active for this client';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_response_coaching BEFORE INSERT ON public.coach_weekly_responses
  FOR EACH ROW EXECUTE FUNCTION public.guard_coach_output();
CREATE TRIGGER trg_guard_priority_coaching BEFORE INSERT ON public.weekly_priorities
  FOR EACH ROW EXECUTE FUNCTION public.guard_coach_output();