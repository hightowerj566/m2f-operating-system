
-- Migration 2: Missions + Standards
INSERT INTO public.standard_definitions (key, label, emoji, is_global, created_by, target_user_id, is_active, sort_order)
SELECT v.key, v.label, v.emoji, true, '00000000-0000-0000-0000-000000000000'::uuid, NULL, true, v.sort_order
FROM (VALUES
  ('wake_on_time',       'Wake On Time',        '⏰', 0),
  ('protein_hit',        'Hit Protein',         '🥩', 1),
  ('steps_hit',          'Hit Steps',           '🚶', 2),
  ('scripture_read',     'Read / Pray',         '📖', 3),
  ('family_time',        'Family Time',         '👨‍👧', 4),
  ('no_phone_at_dinner', 'No Phone at Dinner',  '📵', 5),
  ('hydration_hit',      'Hydration',           '💧', 6)
) AS v(key, label, emoji, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.standard_definitions sd
  WHERE sd.key = v.key AND sd.is_global = true AND sd.target_user_id IS NULL
);

CREATE TABLE public.user_standard_prefs (
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  standard_definition_id uuid NOT NULL REFERENCES public.standard_definitions(id) ON DELETE CASCADE,
  enabled                boolean NOT NULL DEFAULT true,
  updated_at             timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, standard_definition_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_standard_prefs TO authenticated;
GRANT ALL ON public.user_standard_prefs TO service_role;
ALTER TABLE public.user_standard_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own standard prefs"
  ON public.user_standard_prefs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.missions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id smallint NOT NULL REFERENCES public.readiness_categories(id),
  title       text NOT NULL,
  directive   text NOT NULL,
  proof_hint  text,
  difficulty  smallint NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  smallint NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.missions TO authenticated;
GRANT ALL ON public.missions TO service_role;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Missions are readable by authenticated users"
  ON public.missions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coaches manage missions"
  ON public.missions FOR ALL USING (has_role(auth.uid(), 'coach'::app_role));

CREATE TABLE public.user_missions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id   uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  week_start   date NOT NULL,
  status       text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','completed','skipped')),
  completed_at timestamptz,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_missions TO authenticated;
GRANT ALL ON public.user_missions TO service_role;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own missions"
  ON public.user_missions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_user_missions_user_week ON public.user_missions (user_id, week_start DESC);

INSERT INTO public.missions (category_id, title, directive, proof_hint, difficulty, sort_order) VALUES
 (1,'The Carry Test','Load a car seat (or a 25lb box), a duffel, and two grocery bags. Up and down a flight of stairs, three rounds, no setting anything down.','Film one round.',1,1),
 (1,'Train Before She Wakes','Three training sessions this week completed before 7am. Newborn hours start now — on your terms.','Screenshot your logged sessions.',2,2),
 (1,'The 5,000 Add-On','Add 5,000 steps to your daily average every day this week. Strollers don''t push themselves.','Week step summary.',1,3),
 (2,'Say It Out Loud','Tell your wife the single biggest fear you have about becoming a dad. Full sentence. No jokes to break the tension.','No proof needed. You''ll know.',2,1),
 (2,'The Letter','Write your daughter a one-page letter about who her dad is deciding to become. Seal it. Date it for her first birthday.','Photo of the sealed envelope.',2,2),
 (2,'Kill One Excuse','Name the excuse you use most ("no time," "too tired," "next week"). Go one full week without saying it or acting on it.','Journal entry at week''s end.',1,3),
 (3,'Brief the Delivery','Learn the three stages of labor and your job in each. Then brief your wife like it''s an op order — she grades you.','Her sign-off.',1,1),
 (3,'The Three Skills','Diaper, swaddle, safe sleep. Practice all three on a doll or rolled towel until each takes under two minutes.','Timed video of one.',1,2),
 (3,'Car Seat Certified','Install the car seat, then get it checked (fire station, hospital, or certified tech) or verify against the manual line by line.','Photo of the installed seat.',2,3),
 (4,'Finish One Room Thing','Pick the single most avoided nursery task. Finish it this week — completely, not 80%.','Before/after photos.',1,1),
 (4,'Bag By The Door','Pack the full hospital bag — hers, yours, baby''s. Park it by the door where you trip over it.','Photo of the packed bag.',1,2),
 (4,'The Dry Run','Drive the hospital route at the time of day traffic is worst. Time it. Find parking. Walk to the check-in desk.','Your logged time.',2,3),
 (5,'The Newborn Summit','One sit-down with your wife this week: nights, visitors, division of labor. You bring the agenda and take the notes.','Photo of your notes.',2,1),
 (5,'Date Before The Deadline','Plan and execute one real date. You handle every detail — reservation, timing, logistics. She lifts zero fingers.','No proof needed.',1,2),
 (5,'Ask The Question','Ask her: "What are you most afraid I won''t do once the baby''s here?" Listen. Don''t defend. Write down what she says.','Your written answer.',3,3),
 (6,'Find The Real Number','Call your insurance. Get the actual out-of-pocket for delivery. Write the number where you''ll see it daily.','The number, written down.',1,1),
 (6,'The First-Year Budget','Build a 12-month baby budget: diapers, formula/feeding, childcare, medical. One page. Show your wife.','The one-pager.',2,2),
 (6,'Automate One Thing','Open or automate one transfer: emergency fund, 529, or baby buffer account. Any amount. This week.','Screenshot of the transfer.',2,3),
 (7,'The 9:30 Shutdown','Screens off at 9:30pm every night this week. Your sleep is about to become a resource — protect the supply line.','Screen-time report.',2,1),
 (7,'Phone Out Of The Bedroom','Charge your phone outside the bedroom all seven nights. Buy a $10 alarm clock if you have to.','Photo of the charging setup.',1,2),
 (7,'The Morning Block','Same wake time all seven days, weekend included. First 30 minutes: no phone.','Wake-time log.',3,3);

-- Migration 3: Passes, Cohorts, Waitlist
CREATE TABLE public.due_date_passes (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id  text UNIQUE NOT NULL,
  purchased_at       timestamptz NOT NULL DEFAULT now(),
  expires_at         date NOT NULL
);
GRANT SELECT ON public.due_date_passes TO authenticated;
GRANT ALL ON public.due_date_passes TO service_role;
ALTER TABLE public.due_date_passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own passes"
  ON public.due_date_passes FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX idx_due_date_passes_user ON public.due_date_passes (user_id, expires_at DESC);

CREATE TABLE public.cohort_posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_month text NOT NULL,
  content      text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at   timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.cohort_posts TO authenticated;
GRANT ALL ON public.cohort_posts TO service_role;
ALTER TABLE public.cohort_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read cohort posts"
  ON public.cohort_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users post as themselves"
  ON public.cohort_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own posts"
  ON public.cohort_posts FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_cohort_posts_month ON public.cohort_posts (cohort_month, created_at DESC);

CREATE TABLE public.year_one_waitlist (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  joined_at  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.year_one_waitlist TO authenticated;
GRANT ALL ON public.year_one_waitlist TO service_role;
ALTER TABLE public.year_one_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own waitlist row"
  ON public.year_one_waitlist FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
