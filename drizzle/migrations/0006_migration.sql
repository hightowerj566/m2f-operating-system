DROP POLICY IF EXISTS "Authenticated users read cohort posts" ON public.cohort_posts;
CREATE POLICY "Members read own cohort posts" ON public.cohort_posts
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_coach_or_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.due_date IS NOT NULL
      AND to_char(p.due_date, 'YYYY-MM') = cohort_posts.cohort_month
  )
);