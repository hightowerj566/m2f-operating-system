
-- ─────────────────────────────────────────────────────────────
-- Build List overhaul: schema + data reshape.
-- Phase 6 (Father Mode) recommended_week = days after birth (1–40).
-- All other phases: recommended_week = pregnancy week.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.build_milestones
  ADD COLUMN IF NOT EXISTS why_it_matters   text,
  ADD COLUMN IF NOT EXISTS est_minutes      smallint,
  ADD COLUMN IF NOT EXISTS priority         text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS recommended_week smallint,
  ADD COLUMN IF NOT EXISTS required         boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'build_milestones_priority_check'
  ) THEN
    ALTER TABLE public.build_milestones
      ADD CONSTRAINT build_milestones_priority_check
      CHECK (priority IN ('critical','standard','bonus'));
  END IF;
END $$;

ALTER TABLE public.build_milestones DROP CONSTRAINT IF EXISTS build_milestones_phase_check;
ALTER TABLE public.build_milestones
  ADD CONSTRAINT build_milestones_phase_check CHECK (phase BETWEEN 1 AND 6);

COMMENT ON COLUMN public.build_milestones.recommended_week IS
  'For phases 1–5: pregnancy week. For phase 6 (Father Mode): days after birth (1–40).';

-- ─────────────────────────────────────────────────────────────
-- 1) DEACTIVATE removed tasks (preserve user_milestones history).
-- Reason: habit/fitness tasks belong in Daily Standards, not Build.
-- ─────────────────────────────────────────────────────────────
UPDATE public.build_milestones SET is_active = false WHERE title IN (
  'Phone out of the bedroom',
  'One week of shutdowns',
  'Two-week wake anchor',
  'Morning session tested',
  'Pass the carry test',
  'The three skills'
);

-- ─────────────────────────────────────────────────────────────
-- 2) FIX misplaced / retitled tasks + backfill kept tasks.
-- ─────────────────────────────────────────────────────────────
UPDATE public.build_milestones SET
  phase = 4, recommended_week = 33, priority = 'critical', required = true, est_minutes = 90,
  why_it_matters = 'The one item hospital staff will check. Get it right once, sleep easier for months.'
WHERE title = 'Car seat installed & checked';

UPDATE public.build_milestones SET
  phase = 2, recommended_week = 18, priority = 'standard', est_minutes = 30, required = true,
  why_it_matters = 'A tiny recurring transfer compounds. The habit matters more than the amount.'
WHERE title = 'Savings automated';

UPDATE public.build_milestones SET
  title = 'Nursery: room cleared & crib ordered',
  recommended_week = 20, est_minutes = 180, priority = 'standard', required = true,
  why_it_matters = 'Momentum beats a plan. Cleared room + crib on order = the project is real.'
WHERE title = 'Nursery underway';

UPDATE public.build_milestones SET
  phase = 3, recommended_week = 26, priority = 'critical', est_minutes = 90, required = true,
  why_it_matters = 'The single conversation most correlated with couples surviving the newborn phase.'
WHERE title = 'The newborn summit';

UPDATE public.build_milestones SET
  phase = 5, recommended_week = 37, priority = 'standard', est_minutes = 60, required = true,
  why_it_matters = 'You will not remember who you were before her. Freeze this version of you on paper.'
WHERE title = 'Letter to your daughter';

UPDATE public.build_milestones SET
  phase = 2, recommended_week = 18, priority = 'critical', est_minutes = 60, required = true,
  why_it_matters = 'Filed early = defended. Filed late = negotiated.'
WHERE title = 'Leave paperwork filed';

-- Backfill remaining kept tasks
UPDATE public.build_milestones SET
  recommended_week = 5, priority = 'standard', est_minutes = 60, required = true,
  why_it_matters = 'Three weeks proves the habit survives a bad week. That is the whole test.'
WHERE title = 'Three-week training streak';

UPDATE public.build_milestones SET
  recommended_week = 6, priority = 'critical', est_minutes = 15, required = true,
  why_it_matters = 'A fear you name is a fear you can plan around. A fear you hide runs the show.'
WHERE title = 'Say the fear out loud';

UPDATE public.build_milestones SET
  recommended_week = 7, priority = 'standard', est_minutes = 45, required = true,
  why_it_matters = 'You inherit a default father. Naming it is how you choose.'
WHERE title = 'Name your model';

UPDATE public.build_milestones SET
  recommended_week = 8, priority = 'critical', est_minutes = 15, required = true,
  why_it_matters = 'When it starts you will not want to Google. Have the number.'
WHERE title = 'Know the delivery number';

UPDATE public.build_milestones SET
  recommended_week = 15, priority = 'critical', est_minutes = 90, required = true,
  why_it_matters = 'A budget on paper turns "we cannot afford this" into a solvable problem.'
WHERE title = 'First-year budget built';

UPDATE public.build_milestones SET
  recommended_week = 16, priority = 'critical', est_minutes = 20, required = true,
  why_it_matters = 'The buffer that keeps a bad month from becoming a bad year.'
WHERE title = 'Emergency fund started';

UPDATE public.build_milestones SET
  recommended_week = 25, priority = 'critical', est_minutes = 180, required = true,
  why_it_matters = 'The one skill you hope you never use — and cannot afford not to have.'
WHERE title = 'CPR certified';

UPDATE public.build_milestones SET
  recommended_week = 27, priority = 'critical', est_minutes = 60, required = true,
  why_it_matters = 'Chosen calmly at 27 weeks beats chosen frantically at day 3.'
WHERE title = 'Pediatrician selected';

UPDATE public.build_milestones SET
  recommended_week = 28, priority = 'critical', est_minutes = 45, required = true,
  why_it_matters = 'Your job in the room is calm advocacy. That starts with knowing the plan cold.'
WHERE title = 'Birth plan discussed';

UPDATE public.build_milestones SET
  recommended_week = 27, priority = 'standard', est_minutes = 30, required = true,
  why_it_matters = 'Support that is specific beats support that is sincere.'
WHERE title = 'Support role briefed';

UPDATE public.build_milestones SET
  recommended_week = 34, priority = 'critical', est_minutes = 45, required = true,
  why_it_matters = 'Packed early = a normal night. Packing during contractions = a story you tell.'
WHERE title = 'Hospital bag by the door';

UPDATE public.build_milestones SET
  recommended_week = 34, priority = 'critical', est_minutes = 60, required = true,
  why_it_matters = 'You practiced the plan. Now practice the drive.'
WHERE title = 'The dry run';

UPDATE public.build_milestones SET
  recommended_week = 33, priority = 'standard', est_minutes = 240, required = true,
  why_it_matters = 'Ten frozen meals is ten fewer 3am decisions.'
WHERE title = 'Freezer stocked';

UPDATE public.build_milestones SET
  recommended_week = 33, priority = 'critical', est_minutes = 20, required = true,
  why_it_matters = 'Decide together before the group chat decides for you.'
WHERE title = 'Visitor policy locked';

UPDATE public.build_milestones SET
  recommended_week = 35, priority = 'standard', est_minutes = 180, required = false,
  why_it_matters = 'The last photo of just the two of you. Take it on purpose.'
WHERE title = 'Last date before Day One';

-- ─────────────────────────────────────────────────────────────
-- 3) NEW TASKS
-- category_id: 1 physical, 2 mindset, 3 knowledge, 4 home,
--              5 relationship, 6 finances, 7 habits
-- ─────────────────────────────────────────────────────────────

-- Phase 1 · Foundation
INSERT INTO public.build_milestones
  (category_id, phase, title, detail, why_it_matters, points, sort_order, priority, est_minutes, recommended_week, required) VALUES
 (5,1,'Attend one OB appointment','Go to at least one appointment. Hear the heartbeat.',
  'She should never sit in that room alone if you can help it.',
  2,101,'critical',120,9,true),
 (5,1,'First weekly check-in done','15 minutes: her state, your state, one logistics item.',
  'The single habit most correlated with couples surviving year one. This box seeds it — the rhythm lives on your home screen.',
  1,102,'critical',15,8,true),
 (6,1,'Daycare reality check','Call 3 providers. Get costs and waitlist timelines in writing.',
  'Waitlists run 9–18 months in many cities. Week 10 is on time, not early.',
  2,103,'critical',60,10,true),
 (6,1,'Tell your leadership','Inform command/employer on your timeline, by week 14.',
  'They cannot protect a leave window they do not know exists.',
  1,104,'standard',30,13,true),
 (3,1,'Learn her warning signs','Know the 5 call-the-OB-now signs: severe headache/vision changes, heavy bleeding, severe abdominal pain, decreased fetal movement, fluid leaking.',
  'You are the one who makes the call when she second-guesses herself.',
  1,105,'standard',20,12,false);

-- Phase 2 · Framing
INSERT INTO public.build_milestones
  (category_id, phase, title, detail, why_it_matters, points, sort_order, priority, est_minutes, recommended_week, required) VALUES
 (6,2,'Life insurance in force','Term policy, 10–12x income, active — not quoted.',
  'Your death now has a mortgage and a daughter attached.',
  2,201,'critical',120,17,true),
 (6,2,'Beneficiaries updated','SGLI/401k/IRA/policies — every one checked and current.',
  '20 minutes that prevents a probate nightmare.',
  1,202,'critical',20,17,true),
 (6,2,'Will, guardianship & POA drafted','Draft all three. Have the guardianship conversation.',
  'The hardest 30-minute conversation in this app. Have it anyway.',
  3,203,'critical',180,19,true),
 (6,2,'FSA/HSA election planned','Know your dependent-care and health elections and their deadline windows.',
  'Qualifying-life-event windows are use-it-or-lose-it.',
  1,204,'standard',45,20,true),
 (6,2,'Insurance add-baby plan written','Write the exact process and who to call. ~30-day window after birth.',
  'Turns a hard deadline during no-sleep into a 10-minute task.',
  1,205,'standard',20,21,true),
 (5,2,'Registry built together','Sit down and build it with her — not delegated.',
  'It is a values conversation disguised as shopping.',
  1,206,'standard',120,19,false),
 (5,2,'Discuss parenting values','Discipline, screens, faith, money — first pass, out loud.',
  'The fights you have at week 20 are the fights you do not have at 3am.',
  2,207,'standard',60,22,false);

-- Phase 3 · Durability (replacing "The three skills")
INSERT INTO public.build_milestones
  (category_id, phase, title, detail, why_it_matters, points, sort_order, priority, est_minutes, recommended_week, required) VALUES
 (3,3,'Diaper drill','10 reps on a doll, under 2 minutes each.',
  'Reps, not videos.',
  1,301,'standard',30,24,true),
 (3,3,'Swaddle drill','Practiced until automatic.',
  'A tight swaddle at 3am is a superpower.',
  1,302,'standard',30,24,true),
 (3,3,'Safe sleep setup','Configure the real sleep space: Alone, Back, Crib — nothing else in it. Pass your own inspection.',
  'The highest-stakes checklist in this app.',
  2,303,'critical',30,26,true),
 (3,3,'Bottle & formula protocol','Prep, sterilize, store, warm — practiced start to finish.',
  'This is what makes YOUR night shift possible.',
  1,304,'standard',45,27,true),
 (3,3,'Soothing system (5 S''s)','Swaddle, side, shush, swing, suck — learned and rehearsed.',
  'A crying baby with a calm dad is a solvable problem.',
  1,305,'standard',30,28,true),
 (3,3,'Bath & burp practice','Practice at a class, on a doll, or with a friend''s baby.',
  'Confidence in your hands, not your head.',
  1,306,'standard',45,29,false),
 (3,3,'Breastfeeding support role','Know your job: logistics, water/snacks, night handoffs, when to call the lactation line.',
  'Support that is specific beats support that is sincere.',
  1,307,'standard',45,29,false);

-- Phase 4 · Staging
INSERT INTO public.build_milestones
  (category_id, phase, title, detail, why_it_matters, points, sort_order, priority, est_minutes, recommended_week, required) VALUES
 (3,4,'Hospital pre-registration done','Registered, insurance on file, name confirmed.',
  'Paperwork at week 32 beats a clipboard during contractions.',
  1,401,'critical',30,32,true),
 (4,4,'Nursery functional','Crib built, changing station stocked, clothes washed and sorted.',
  'Done means she could arrive tonight.',
  2,402,'standard',120,32,true),
 (4,4,'Comms plan set','OB line in favorites, one designated family relay person, dog/house person on standby with a key.',
  'On Day One your hands stay free and your attention stays in the room.',
  1,403,'critical',30,35,true),
 (3,4,'PPD/PPA briefing','Learn the signs — in her AND in you — before exhaustion blurs judgment. Save the OB and support-line numbers now.',
  'Day 14 is too late to learn what day 14 looks like.',
  2,404,'critical',30,35,true),
 (4,4,'House reset','Deep clean done or booked, laundry simplified, supplies staged on every floor.',
  'Every solved problem now is a problem that does not exist at 3am.',
  1,405,'standard',180,34,false);

-- Phase 5 · Mission Mode
INSERT INTO public.build_milestones
  (category_id, phase, title, detail, why_it_matters, points, sort_order, priority, est_minutes, recommended_week, required) VALUES
 (3,5,'Brief the Day One Playbook','Read the in-app playbook. Rehearse it out loud with her once.',
  'You practiced the route; now practice the plan.',
  1,501,'critical',30,36,true),
 (4,5,'Car staged','Gas above half at all times, seat verified, trunk clear for the bag.',
  'Ready is a state, not an event.',
  1,502,'critical',15,36,true),
 (3,5,'5-1-1 memorized','Contractions 5 min apart, 1 min long, for 1 hour = go. Water breaks = call regardless. Say it cold.',
  'The go/no-go decision is yours to know cold.',
  1,503,'critical',10,37,true),
 (2,5,'Father standards written','5 sentences: the kind of father you will be.',
  'This becomes your Day One anchor.',
  2,504,'standard',45,38,false);

-- Phase 6 · Father Mode (recommended_week = days after birth, 1–40)
INSERT INTO public.build_milestones
  (category_id, phase, title, detail, why_it_matters, points, sort_order, priority, est_minutes, recommended_week, required) VALUES
 (3,6,'Birth certificate + SSN filed','Usually initiated at the hospital — confirm before discharge.',
  'Everything downstream (insurance, benefits) needs these.',
  2,601,'critical',30,2,true),
 (6,6,'Baby added to insurance','Execute the plan you wrote in Phase 2.',
  'Hard ~30-day window. Missing it is a five-figure mistake.',
  2,602,'critical',15,5,true),
 (3,6,'Pediatrician first visit done','Day 3–5 weight and jaundice check completed.',
  'Non-negotiable newborn medicine.',
  2,603,'critical',120,4,true),
 (2,6,'First full solo block','Bath-to-bedtime, alone, start to finish.',
  'Competence is reps — and she needs to see the baby is safe with you.',
  2,604,'critical',180,10,true),
 (5,6,'Night-shift system running','Agreed shifts, executed 7 straight nights.',
  'Decided before exhaustion decides for you.',
  2,605,'critical',30,7,true),
 (3,6,'PPD/PPA check — her and you','Run the signs at day 14. Persistent hopelessness, rage, or numbness = call the OB.',
  'Making that call for her is love, not overstepping.',
  2,606,'critical',20,14,true),
 (2,6,'Readiness re-test','Take the day-40 re-test as your Father Mode baseline.',
  'The score reset the day she arrived. Build the next version.',
  1,607,'standard',20,40,true),
 (5,6,'Photos of her with the baby','Document your wife WITH the baby, ongoing.',
  'She is in the frame of almost nobody''s newborn photos. Fix that.',
  1,608,'standard',15,3,false);
