-- 1) Let coaches/admins call generate_scheduled_weeks from the client.
-- The function is SECURITY DEFINER; we add an explicit role check inside.
CREATE OR REPLACE FUNCTION public.generate_scheduled_weeks(_assignment_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  a record;
  p record;
  wk int;
  weeks int;
  ws date;
  we date;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

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
END $function$;

GRANT EXECUTE ON FUNCTION public.generate_scheduled_weeks(uuid) TO authenticated, service_role;

-- 2) Broaden member SELECT so the client can preview upcoming (locked) weeks.
-- Content access is enforced separately via week_is_accessible().
DROP POLICY IF EXISTS "Members view accessible weeks" ON public.scheduled_program_weeks;
CREATE POLICY "Members view their program weeks"
ON public.scheduled_program_weeks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.program_assignments pa
    WHERE pa.id = scheduled_program_weeks.assignment_id
      AND pa.user_id = auth.uid()
  )
);

-- 3) Let admins manage weeks the same way coaches can.
DROP POLICY IF EXISTS "Coaches manage all weeks" ON public.scheduled_program_weeks;
CREATE POLICY "Coaches and admins manage all weeks"
ON public.scheduled_program_weeks FOR ALL
USING (public.has_role(auth.uid(),'coach') OR public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'coach') OR public.has_role(auth.uid(),'admin'));
