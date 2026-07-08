CREATE TABLE public.build_milestones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id smallint NOT NULL REFERENCES public.readiness_categories(id),
  phase       smallint NOT NULL CHECK (phase BETWEEN 1 AND 5),
  title       text NOT NULL,
  detail      text,
  points      smallint NOT NULL DEFAULT 1 CHECK (points BETWEEN 1 AND 3),
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  smallint NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.build_milestones TO authenticated;
GRANT ALL ON public.build_milestones TO service_role;
ALTER TABLE public.build_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Milestones readable by authenticated users"
  ON public.build_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coaches manage milestones"
  ON public.build_milestones FOR ALL USING (has_role(auth.uid(), 'coach'::app_role));

CREATE TABLE public.user_milestones (
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id uuid NOT NULL REFERENCES public.build_milestones(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, milestone_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_milestones TO authenticated;
GRANT ALL ON public.user_milestones TO service_role;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own milestone completions"
  ON public.user_milestones FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.build_milestones (category_id, phase, title, detail, points, sort_order) VALUES
 (1,1,'Three-week training streak','Train at least 3x/week for three straight weeks. Consistency before intensity.',2,1),
 (7,1,'Phone out of the bedroom','Charge it outside the room, every night, for one week. Keep it there.',1,2),
 (2,1,'Say the fear out loud','Tell your wife or a friend your biggest fear about becoming a dad. Once counts — if it''s real.',1,3),
 (2,1,'Name your model','Write down what your dad got right and what you''ll do differently. One page, honest.',1,4),
 (6,1,'Know the delivery number','Call insurance. Get the real out-of-pocket for delivery. Write it down.',1,5),
 (1,2,'Pass the carry test','Car seat + duffel + two grocery bags, up a flight of stairs, three rounds, nothing set down.',1,6),
 (4,2,'Nursery underway','Room cleared, crib ordered or built, plan on paper. Started for real, not "started".',1,7),
 (6,2,'First-year budget built','Diapers, feeding, childcare, medical — 12 months on one page. Show her.',2,8),
 (6,2,'Emergency fund started','Open it or automate a transfer into it. Any amount. It exists.',1,9),
 (5,2,'The newborn summit','Sit-down with your wife: nights, visitors, division of labor. You bring the agenda.',2,10),
 (2,2,'Letter to your daughter','One page on who her dad is deciding to become. Sealed, dated for her first birthday.',2,11),
 (7,2,'One week of shutdowns','Screens off at 9:30pm, seven straight nights.',1,12),
 (3,3,'CPR certified','Infant CPR class — in person or certified online course. Completed, not scheduled.',2,13),
 (3,3,'Pediatrician selected','Interviewed or chosen, contact saved, first-visit plan known.',2,14),
 (3,3,'The three skills','Diaper, swaddle, safe sleep — practiced until each takes under two minutes.',2,15),
 (3,3,'Birth plan discussed','You can brief the plan — stages, preferences, your job in the room. She signs off.',1,16),
 (4,3,'Car seat installed & checked','Installed and verified — fire station, hospital tech, or manual line-by-line.',2,17),
 (6,3,'Leave paperwork filed','Paternity/military leave requested and confirmed in writing.',2,18),
 (5,3,'Support role briefed','Ask her: "What are you most afraid I won''t do?" Listen. Write it down. Adjust.',1,19),
 (1,3,'Morning session tested','One full week training before 7am. Newborn hours, your terms.',1,20),
 (7,3,'Two-week wake anchor','Same wake time, 14 straight days, weekends included.',2,21),
 (4,4,'Hospital bag by the door','Hers, yours, baby''s — packed and staged where you trip over it.',2,22),
 (4,4,'The dry run','Drive the route at worst-traffic time. Time it. Park. Walk to check-in.',1,23),
 (4,4,'Freezer stocked','Ten+ meals prepped and frozen. Future-you says thanks at 3am.',1,24),
 (5,4,'Visitor policy locked','You two agree who visits, when, and for how long — before the family group chat decides for you.',1,25),
 (5,4,'Last date before Day One','Planned and executed by you, every detail. She lifts zero fingers.',1,26),
 (6,4,'Savings automated','529 or baby-buffer transfer running on autopilot.',1,27);