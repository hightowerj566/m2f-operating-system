
-- 1. Categories
CREATE TABLE public.readiness_categories (
  id smallint PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  sort_order smallint NOT NULL
);
GRANT SELECT ON public.readiness_categories TO anon, authenticated;
GRANT ALL ON public.readiness_categories TO service_role;
ALTER TABLE public.readiness_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly readable" ON public.readiness_categories FOR SELECT USING (true);

INSERT INTO public.readiness_categories (id, slug, name, sort_order) VALUES
  (1,'physical','PHYSICAL',1),
  (2,'mindset','MINDSET',2),
  (3,'knowledge','KNOWLEDGE',3),
  (4,'home','HOME',4),
  (5,'relationship','RELATIONSHIP',5),
  (6,'finances','FINANCES',6),
  (7,'habits','HABITS',7);

-- 2. Questions
CREATE TABLE public.assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id smallint REFERENCES public.readiness_categories(id),
  code text UNIQUE NOT NULL,
  prompt text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('scored','routing')),
  sort_order smallint NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.assessment_questions TO anon, authenticated;
GRANT ALL ON public.assessment_questions TO service_role;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are publicly readable" ON public.assessment_questions FOR SELECT USING (true);

CREATE TABLE public.assessment_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  label text NOT NULL,
  points smallint,
  routing_value text,
  sort_order smallint NOT NULL
);
GRANT SELECT ON public.assessment_options TO anon, authenticated;
GRANT ALL ON public.assessment_options TO service_role;
ALTER TABLE public.assessment_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Options are publicly readable" ON public.assessment_options FOR SELECT USING (true);

-- 3. Assessments
CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  taken_at timestamptz NOT NULL DEFAULT now(),
  total_score smallint NOT NULL,
  weeks_remaining smallint,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own assessments" ON public.assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own assessments" ON public.assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_assessments_user ON public.assessments (user_id, taken_at DESC);

CREATE TABLE public.assessment_category_scores (
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  category_id smallint NOT NULL REFERENCES public.readiness_categories(id),
  score smallint NOT NULL CHECK (score BETWEEN 0 AND 10),
  PRIMARY KEY (assessment_id, category_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_category_scores TO authenticated;
GRANT ALL ON public.assessment_category_scores TO service_role;
ALTER TABLE public.assessment_category_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own category scores" ON public.assessment_category_scores FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND a.user_id = auth.uid()));
CREATE POLICY "Users insert own category scores" ON public.assessment_category_scores FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND a.user_id = auth.uid()));

-- 4. Profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS baby_arrived_at date,
  ADD COLUMN IF NOT EXISTS baby_name text,
  ADD COLUMN IF NOT EXISTS last_assessment_id uuid REFERENCES public.assessments(id);

-- 5. Lead payload
ALTER TABLE public.father_athlete_leads
  ADD COLUMN IF NOT EXISTS total_score smallint,
  ADD COLUMN IF NOT EXISTS category_scores jsonb,
  ADD COLUMN IF NOT EXISTS weakest_category text,
  ADD COLUMN IF NOT EXISTS due_date date;

-- 6. Seed questions
INSERT INTO public.assessment_questions (id, category_id, code, prompt, kind, sort_order) VALUES
 ('a0000000-0000-4000-8000-000000000001',1,'P1','Last 30 days, how many weeks did you train at least 3 times?','scored',1),
 ('a0000000-0000-4000-8000-000000000002',1,'P2','Could you carry a car seat, a stroller, and four grocery bags up a flight of stairs — today, without a warmup?','scored',2),
 ('a0000000-0000-4000-8000-000000000003',2,'M1','When you think about the day she arrives, the honest first feeling is:','scored',3),
 ('a0000000-0000-4000-8000-000000000004',2,'M2','Have you said any of your fears about becoming a dad out loud — to anyone?','scored',4),
 ('a0000000-0000-4000-8000-000000000005',3,'K1','Do you know what actually happens at the hospital — stages of labor, when to go, what your job is in the room?','scored',5),
 ('a0000000-0000-4000-8000-000000000006',3,'K2','Could you, right now, do all three: change a diaper, swaddle, and safely put a newborn down to sleep?','scored',6),
 ('a0000000-0000-4000-8000-000000000007',4,'H1','Where does the nursery/baby-space stand?','scored',7),
 ('a0000000-0000-4000-8000-000000000008',4,'H2','Do you have a hospital-day plan — bag packed, route known, who''s watching the dogs?','scored',8),
 ('a0000000-0000-4000-8000-000000000009',5,'REL1','In the last two weeks, how many real conversations have you had with your wife about how you two will handle the newborn phase — nights, visitors, division of labor?','scored',9),
 ('a0000000-0000-4000-8000-000000000010',5,'REL2','Does she feel like you''re preparing WITH her, or watching her prepare?','scored',10),
 ('a0000000-0000-4000-8000-000000000011',6,'F1','Do you know the real number — what delivery, insurance, and the first year will roughly cost you?','scored',11),
 ('a0000000-0000-4000-8000-000000000012',6,'F2','If you couldn''t work for 8 weeks starting today, your family would be:','scored',12),
 ('a0000000-0000-4000-8000-000000000013',7,'HB1','Pick the statement closest to your evenings:','scored',13),
 ('a0000000-0000-4000-8000-000000000014',7,'HB2','Sleep, most nights:','scored',14),
 ('a0000000-0000-4000-8000-000000000015',NULL,'R1','Training experience:','routing',15),
 ('a0000000-0000-4000-8000-000000000016',NULL,'R2','Equipment access:','routing',16),
 ('a0000000-0000-4000-8000-000000000017',NULL,'R3','Days per week you can realistically train:','routing',17);

INSERT INTO public.assessment_options (question_id, label, points, routing_value, sort_order) VALUES
 ('a0000000-0000-4000-8000-000000000001','None',0,NULL,1),
 ('a0000000-0000-4000-8000-000000000001','One or two',1,NULL,2),
 ('a0000000-0000-4000-8000-000000000001','Most weeks',3,NULL,3),
 ('a0000000-0000-4000-8000-000000000001','Every week',5,NULL,4),
 ('a0000000-0000-4000-8000-000000000002','That''s a workout program, not a question',0,NULL,1),
 ('a0000000-0000-4000-8000-000000000002','I''d make it, barely',1,NULL,2),
 ('a0000000-0000-4000-8000-000000000002','Yes, uncomfortably',3,NULL,3),
 ('a0000000-0000-4000-8000-000000000002','Easily. That''s Tuesday',5,NULL,4),
 ('a0000000-0000-4000-8000-000000000003','Quiet panic',0,NULL,1),
 ('a0000000-0000-4000-8000-000000000003','Mostly fear, some excitement',1,NULL,2),
 ('a0000000-0000-4000-8000-000000000003','Excited but unprepared',3,NULL,3),
 ('a0000000-0000-4000-8000-000000000003','Ready. Nervous, but ready',5,NULL,4),
 ('a0000000-0000-4000-8000-000000000004','I don''t talk about that',0,NULL,1),
 ('a0000000-0000-4000-8000-000000000004','Only to myself in the truck',1,NULL,2),
 ('a0000000-0000-4000-8000-000000000004','Once or twice to my wife or a friend',3,NULL,3),
 ('a0000000-0000-4000-8000-000000000004','Yes, openly',5,NULL,4),
 ('a0000000-0000-4000-8000-000000000005','My job is to not pass out',0,NULL,1),
 ('a0000000-0000-4000-8000-000000000005','I''ve seen movies',1,NULL,2),
 ('a0000000-0000-4000-8000-000000000005','I''ve read some things',3,NULL,3),
 ('a0000000-0000-4000-8000-000000000005','I could brief someone else on it',5,NULL,4),
 ('a0000000-0000-4000-8000-000000000006','Zero of three',0,NULL,1),
 ('a0000000-0000-4000-8000-000000000006','One of three',1,NULL,2),
 ('a0000000-0000-4000-8000-000000000006','Two of three',3,NULL,3),
 ('a0000000-0000-4000-8000-000000000006','All three',5,NULL,4),
 ('a0000000-0000-4000-8000-000000000007','It''s still the room we don''t talk about',0,NULL,1),
 ('a0000000-0000-4000-8000-000000000007','Started, stalled',1,NULL,2),
 ('a0000000-0000-4000-8000-000000000007','Mostly done',3,NULL,3),
 ('a0000000-0000-4000-8000-000000000007','Done — crib built, car seat installed',5,NULL,4),
 ('a0000000-0000-4000-8000-000000000008','No plan',0,NULL,1),
 ('a0000000-0000-4000-8000-000000000008','A plan in my head',1,NULL,2),
 ('a0000000-0000-4000-8000-000000000008','Half-executed',3,NULL,3),
 ('a0000000-0000-4000-8000-000000000008','Bag''s by the door',5,NULL,4),
 ('a0000000-0000-4000-8000-000000000009','Zero',0,NULL,1),
 ('a0000000-0000-4000-8000-000000000009','It came up once, briefly',1,NULL,2),
 ('a0000000-0000-4000-8000-000000000009','One real conversation',3,NULL,3),
 ('a0000000-0000-4000-8000-000000000009','It''s an ongoing conversation',5,NULL,4),
 ('a0000000-0000-4000-8000-000000000010','She''d say watching',0,NULL,1),
 ('a0000000-0000-4000-8000-000000000010','Honestly, mostly watching',1,NULL,2),
 ('a0000000-0000-4000-8000-000000000010','Mixed',3,NULL,3),
 ('a0000000-0000-4000-8000-000000000010','With her — she''d say it too',5,NULL,4),
 ('a0000000-0000-4000-8000-000000000011','No idea and I''d rather not know',0,NULL,1),
 ('a0000000-0000-4000-8000-000000000011','A guess',1,NULL,2),
 ('a0000000-0000-4000-8000-000000000011','A researched estimate',3,NULL,3),
 ('a0000000-0000-4000-8000-000000000011','Yes, and it''s budgeted',5,NULL,4),
 ('a0000000-0000-4000-8000-000000000012','In trouble fast',0,NULL,1),
 ('a0000000-0000-4000-8000-000000000012','OK for a couple weeks',1,NULL,2),
 ('a0000000-0000-4000-8000-000000000012','Tight but fine',3,NULL,3),
 ('a0000000-0000-4000-8000-000000000012','Covered — emergency fund + leave sorted',5,NULL,4),
 ('a0000000-0000-4000-8000-000000000013','Screens until I fall asleep',0,NULL,1),
 ('a0000000-0000-4000-8000-000000000013','Mostly screens, some intention',1,NULL,2),
 ('a0000000-0000-4000-8000-000000000013','A loose routine',3,NULL,3),
 ('a0000000-0000-4000-8000-000000000013','A locked routine — I run my evenings, they don''t run me',5,NULL,4),
 ('a0000000-0000-4000-8000-000000000014','Under 6 hours, chaotic',0,NULL,1),
 ('a0000000-0000-4000-8000-000000000014','Under 6, consistent-ish',1,NULL,2),
 ('a0000000-0000-4000-8000-000000000014','6–7, decent',3,NULL,3),
 ('a0000000-0000-4000-8000-000000000014','7+, protected',5,NULL,4),
 ('a0000000-0000-4000-8000-000000000015','Under a year',NULL,'under_1yr',1),
 ('a0000000-0000-4000-8000-000000000015','1–3 years',NULL,'1_3yr',2),
 ('a0000000-0000-4000-8000-000000000015','3+ years consistent',NULL,'3plus',3),
 ('a0000000-0000-4000-8000-000000000016','Full gym',NULL,'full_gym',1),
 ('a0000000-0000-4000-8000-000000000016','Home setup (some equipment)',NULL,'home_setup',2),
 ('a0000000-0000-4000-8000-000000000016','Bodyweight only',NULL,'bodyweight',3),
 ('a0000000-0000-4000-8000-000000000017','2',NULL,'2',1),
 ('a0000000-0000-4000-8000-000000000017','3',NULL,'3',2),
 ('a0000000-0000-4000-8000-000000000017','4',NULL,'4',3),
 ('a0000000-0000-4000-8000-000000000017','5+',NULL,'5plus',4);
