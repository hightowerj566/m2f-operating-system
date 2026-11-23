DROP POLICY IF EXISTS "Missions are readable by authenticated users" ON public.missions;
CREATE POLICY "Members read active missions" ON public.missions FOR SELECT TO authenticated
USING (is_active OR public.is_coach_or_admin(auth.uid()));
DROP POLICY IF EXISTS "Milestones readable by authenticated users" ON public.build_milestones;
CREATE POLICY "Members read active milestones" ON public.build_milestones FOR SELECT TO authenticated
USING (is_active OR public.is_coach_or_admin(auth.uid()));