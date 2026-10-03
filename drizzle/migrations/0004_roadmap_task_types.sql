ALTER TABLE public.build_milestones
  ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'do',
  ADD COLUMN IF NOT EXISTS lesson_slug text,
  ADD COLUMN IF NOT EXISTS conversation_guide_slug text;
ALTER TABLE public.build_milestones
  ADD CONSTRAINT build_milestones_task_type_check CHECK (task_type IN ('do','learn','talk'));

UPDATE public.build_milestones SET task_type='learn', lesson_slug = v.slug
FROM (VALUES
  ('4858fe49-cb61-423a-aa13-1d238f540f2c'::uuid,'pregnancy-warning-signs'),
  ('c107179b-981a-4549-8ac0-276aad8d6fe0'::uuid,'safe-sleep-environment'),
  ('36b18663-07e3-4e25-a442-da01b3263771'::uuid,'soothing-techniques'),
  ('dd0492ee-be5b-4805-ac64-03097c714f27'::uuid,'breastfeeding-support'),
  ('4d0f59a9-9f58-4f44-87b4-15ba7f338e62'::uuid,'birth-plan'),
  ('ffeb4690-5f9d-4eb4-aa76-7677268ddab7'::uuid,'bottle-feeding'),
  ('f3a8047c-61d4-4900-8a4f-a93739460cb7'::uuid,'postpartum-depression'),
  ('2c31602f-fffd-0000-0000-000000000000'::uuid,'postpartum-depression'),
  ('551cb07d-ad43-45c3-91fc-c0a56e0dce21'::uuid,'when-to-go-to-hospital')
) AS v(id, slug) WHERE public.build_milestones.id = v.id;

UPDATE public.build_milestones SET task_type='learn', lesson_slug='postpartum-depression'
WHERE phase = 11 AND title = 'Learn the warning signs of postpartum depression';

UPDATE public.build_milestones SET task_type='talk', conversation_guide_slug = v.slug
FROM (VALUES
  ('733ceb48-8bcc-4552-9c68-dab21d2d6999'::uuid,'say-the-fear'),
  ('2eb3325e-fa87-45ed-bb6e-9f3d4c2d8dcc'::uuid,'weekly-check-in'),
  ('15274581-bee8-4e82-992a-7111feb6cb3b'::uuid,'parenting-values'),
  ('24b33f0b-d8a7-4e4e-81e9-0c5c8d626f71'::uuid,'first-week-home'),
  ('b46d4743-5a80-4905-9b53-5fd3ca0affc9'::uuid,'support-role'),
  ('ccf06a28-b016-4f29-adf3-2eb69cb5d7cf'::uuid,'visitor-plan'),
  ('f3d963a6-b6c2-4ba2-a75e-40a41d06d490'::uuid,'night-shifts'),
  ('97967b94-2e71-4783-b485-647519544452'::uuid,'visitor-plan'),
  ('16a9efc1-0000-0000-0000-000000000000'::uuid,'weekly-check-in')
) AS v(id, slug) WHERE public.build_milestones.id = v.id;

UPDATE public.build_milestones SET task_type='talk', conversation_guide_slug='weekly-check-in'
WHERE phase = 13 AND title = 'Start a weekly check-in with her';