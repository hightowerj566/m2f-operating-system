
-- === Add WITH CHECK to UPDATE policies ===
DROP POLICY "Users can update own check-ins" ON public.daily_check_ins;
CREATE POLICY "Users can update own check-ins" ON public.daily_check_ins
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own standards" ON public.daily_standards;
CREATE POLICY "Users can update own standards" ON public.daily_standards
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own weights" ON public.daily_weights;
CREATE POLICY "Users can update own weights" ON public.daily_weights
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own targets" ON public.macro_targets;
CREATE POLICY "Users can update own targets" ON public.macro_targets
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Coaches can update client targets" ON public.macro_targets;
CREATE POLICY "Coaches can update client targets" ON public.macro_targets
  FOR UPDATE USING (has_role(auth.uid(), 'coach'::app_role))
  WITH CHECK (has_role(auth.uid(), 'coach'::app_role));

DROP POLICY "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own current day" ON public.program_assignments;
CREATE POLICY "Users can update own current day" ON public.program_assignments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own maxes" ON public.user_maxes;
CREATE POLICY "Users can update own maxes" ON public.user_maxes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own logs" ON public.workout_logs;
CREATE POLICY "Users can update own logs" ON public.workout_logs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- === Revoke direct EXECUTE on SECURITY DEFINER helpers ===
-- These are used internally by RLS policies and triggers, which run with
-- table-owner privileges — revoking from anon/authenticated/public does NOT
-- affect policy evaluation or trigger execution.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
