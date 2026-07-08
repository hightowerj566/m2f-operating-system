
-- M2F PERFORM: Power block A1 (array[0]) days 60,67,74,81
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{0,name}', '"A1. DB Single Arm Push Press"'), '{0,detail}', '"3×5/side — Explosive drive"')
WHERE id = '5300976f-cfa7-4ee6-9b03-10aeb292f4e1';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{0,name}', '"A1. Push Press"'), '{0,detail}', '"3×5 — Explosive drive"')
WHERE id = '55e632a8-0e09-4b4a-ac58-6cbcda240db8';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{0,name}', '"A1. DB Single Arm Push Press"'), '{0,detail}', '"3×5/side — Explosive drive"')
WHERE id = 'bc40de2b-197f-4790-b400-d3fb363c049b';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{0,name}', '"A1. Push Press"'), '{0,detail}', '"3×5 — Explosive drive"')
WHERE id = '2229ec6a-f5f6-4156-a661-cf8c7f6ce6b8';

-- M2F PERFORM: Secondary C1 (array[4]) days 85,92,99,106
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{4,name}', '"C1. DB Single Arm OH Press (Neutral Grip)"'), '{4,detail}', '"3×6/side — Tempo 2010, RIR 2"')
WHERE id = 'a000a22e-a803-46db-8f3f-ff86aee8c1e2';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{4,name}', '"C1. Half Kneeling DB Press"'), '{4,detail}', '"3×6/side — Tempo 2010, RIR 2"')
WHERE id = '2edf29ab-934d-4e13-921b-5f90b8915895';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{4,name}', '"C1. Arnold Press"'), '{4,detail}', '"3×8 — Tempo 2010, RIR 2"')
WHERE id = 'a0ebff20-65db-42af-b810-20e59fb434b3';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{4,name}', '"C1. Z Press"'), '{4,detail}', '"3×6 — Tempo 2010, RIR 2"')
WHERE id = '2f99ac33-fcc7-4124-a59f-a58dd113c5d3';

-- M2F PERFORM: Primary B1 (array[2]) days 88,95,102,109
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{2,name}', '"B1. DB Single Arm OH Press (Neutral Grip)"'), '{2,detail}', '"4×6/side — Tempo 2010, RPE 8"')
WHERE id = '73a37c45-b2de-4e6e-abce-0e0f7cd23d4b';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{2,name}', '"B1. Half Kneeling DB Press"'), '{2,detail}', '"4×6/side — Tempo 2010, RPE 8"')
WHERE id = 'f25d2837-82fe-490d-a70f-0fff4af394f6';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{2,name}', '"B1. Arnold Press"'), '{2,detail}', '"4×8 — Tempo 2010, RPE 8"')
WHERE id = '56700b4a-92c5-4e86-9cc5-f955eca73119';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{2,name}', '"B1. Seated DB OH Press"'), '{2,detail}', '"4×8 — Tempo 2010, RPE 8"')
WHERE id = '555583a8-c623-4b2f-bab6-980845ac369d';

-- M2F REBUILD: Phase 2 Power A1 (array[0]) days 32,39,46,53
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{0,name}', '"A1. DB Push Press"'), '{0,detail}', '"3×5/side — Explosive push"')
WHERE id = '41fcbcd2-8aba-49e7-834a-1fd3c28d0fc0';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{0,name}', '"A1. Med Ball Overhead Throw"'), '{0,detail}', '"3×5 — Explosive push"')
WHERE id = '7d125c65-7cf9-446e-9b35-6f55460dca6e';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{0,name}', '"A1. DB Single Arm Push Press"'), '{0,detail}', '"3×5/side — Explosive push"')
WHERE id = '22c08138-75d3-4701-848b-f10d254c6790';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{0,name}', '"A1. Push Press"'), '{0,detail}', '"3×5 — Explosive push"')
WHERE id = '7004d2d0-0434-4ce8-a2a3-212e1e66529a';

-- M2F REBUILD: Phase 2-3 Secondary C1 (array[4]) days 57,64,71,78
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{4,name}', '"C1. DB Single Arm OH Press (Neutral Grip)"'), '{4,detail}', '"3×8/side — Tempo 2010, RIR 2"')
WHERE id = '8d824045-a352-43ee-be7a-ba9a5e12214d';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{4,name}', '"C1. Half Kneeling DB Press"'), '{4,detail}', '"3×8/side — Tempo 2010, RIR 2"')
WHERE id = '3960a3db-bee8-48e6-904e-302c66bd1620';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{4,name}', '"C1. Arnold Press"'), '{4,detail}', '"3×10 — Tempo 2010, RIR 2"')
WHERE id = '1c453486-d17e-486d-a3d1-3eb692dff634';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(exercises, '{4,name}', '"C1. Z Press"'), '{4,detail}', '"3×8 — Tempo 2010, RIR 2"')
WHERE id = 'ae963615-ded1-427d-ba84-389159f47b97';

-- M2F REBUILD: Phase 3-4 (days 60,67,74,81) — both A1 (array[0]) AND B1 (array[2])
UPDATE program_days SET exercises = jsonb_set(jsonb_set(jsonb_set(jsonb_set(
  exercises, '{0,name}', '"A1. DB Single Arm Push Press"'), '{0,detail}', '"3×5/side — Explosive drive"'), '{2,name}', '"B1. DB Single Arm OH Press (Neutral Grip)"'), '{2,detail}', '"4×8/side — Tempo 2010, RPE 7-8"')
WHERE id = 'ba7902d7-111b-4b13-acb6-027ba4a94c47';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(jsonb_set(jsonb_set(
  exercises, '{0,name}', '"A1. Push Press"'), '{0,detail}', '"3×5 — Explosive drive"'), '{2,name}', '"B1. Half Kneeling DB Press"'), '{2,detail}', '"4×8/side — Tempo 2010, RPE 7-8"')
WHERE id = '2897eeda-cf00-43a1-ae24-58b0a1ca3c64';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(jsonb_set(jsonb_set(
  exercises, '{0,name}', '"A1. DB Single Arm Push Press"'), '{0,detail}', '"3×5/side — Explosive drive"'), '{2,name}', '"B1. Arnold Press"'), '{2,detail}', '"4×10 — Tempo 2010, RPE 7-8"')
WHERE id = '6b3d18d5-85db-48db-bb47-1241cfd0a178';
UPDATE program_days SET exercises = jsonb_set(jsonb_set(jsonb_set(jsonb_set(
  exercises, '{0,name}', '"A1. Push Press"'), '{0,detail}', '"3×5 — Explosive drive"'), '{2,name}', '"B1. Seated DB OH Press"'), '{2,detail}', '"4×8 — Tempo 2010, RPE 7-8"')
WHERE id = '6d455d6a-6bc4-49cb-9119-7adf3c679d7b';
