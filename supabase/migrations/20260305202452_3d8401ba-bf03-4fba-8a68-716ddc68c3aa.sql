
-- ==========================================
-- DBTC PROGRAM FIXES
-- ==========================================

-- Fix #2: Replace "Behind the Neck Push Press" → "Landmine Press"
DO $$
DECLARE
  r RECORD;
  new_ex jsonb;
  elem jsonb;
  i int;
BEGIN
  FOR r IN
    SELECT id, exercises FROM program_days
    WHERE program_id = 'dad0b0d0-1234-5678-9012-123456789012'
    AND exercises::text LIKE '%Behind the Neck Push Press%'
  LOOP
    new_ex := '[]'::jsonb;
    FOR i IN 0..jsonb_array_length(r.exercises) - 1 LOOP
      elem := r.exercises->i;
      IF elem->>'name' = 'Behind the Neck Push Press' THEN
        elem := jsonb_set(elem, '{name}', '"Landmine Press"');
        elem := jsonb_set(elem, '{detail}', '"4×5 — Single arm, explosive press from rack. Core braced, slight forward lean. RIR: 2–3."');
      END IF;
      new_ex := new_ex || jsonb_build_array(elem);
    END LOOP;
    UPDATE program_days SET exercises = new_ex WHERE id = r.id;
  END LOOP;
END $$;

-- Fix #5: Add Standing Lateral Raise 3×15 to Heavy Push + Pull days (before HIIT finisher)
DO $$
DECLARE
  r RECORD;
  new_ex jsonb;
  i int;
  last_idx int;
  lat_raise jsonb := '{"name":"Standing Lateral Raise","detail":"3×15 — Controlled, no momentum. Constant tension. RIR: 1–2.","group":"E","reps":15,"sets":3,"rest":60,"type":"exercise"}'::jsonb;
BEGIN
  FOR r IN
    SELECT id, exercises FROM program_days
    WHERE program_id = 'dad0b0d0-1234-5678-9012-123456789012'
    AND label = 'Heavy Push + Pull'
    AND exercises::text NOT LIKE '%Standing Lateral Raise%'
  LOOP
    last_idx := jsonb_array_length(r.exercises) - 1;
    new_ex := '[]'::jsonb;
    FOR i IN 0..last_idx LOOP
      IF i = last_idx THEN
        new_ex := new_ex || jsonb_build_array(lat_raise);
      END IF;
      new_ex := new_ex || jsonb_build_array(r.exercises->i);
    END LOOP;
    UPDATE program_days SET exercises = new_ex WHERE id = r.id;
  END LOOP;
END $$;

-- Fix #9: Add Seated Calf Raise 3×15 to Heavy Lower days (before LISS finisher)
DO $$
DECLARE
  r RECORD;
  new_ex jsonb;
  i int;
  last_idx int;
  calf_raise jsonb := '{"name":"Seated Calf Raise","detail":"3×15 — Full stretch at bottom, squeeze at top. 2 sec eccentric. RIR: 1–2.","group":"E","reps":15,"sets":3,"rest":60,"type":"exercise"}'::jsonb;
BEGIN
  FOR r IN
    SELECT id, exercises FROM program_days
    WHERE program_id = 'dad0b0d0-1234-5678-9012-123456789012'
    AND label = 'Heavy Lower'
    AND exercises::text NOT LIKE '%Seated Calf Raise%'
  LOOP
    last_idx := jsonb_array_length(r.exercises) - 1;
    new_ex := '[]'::jsonb;
    FOR i IN 0..last_idx LOOP
      IF i = last_idx THEN
        new_ex := new_ex || jsonb_build_array(calf_raise);
      END IF;
      new_ex := new_ex || jsonb_build_array(r.exercises->i);
    END LOOP;
    UPDATE program_days SET exercises = new_ex WHERE id = r.id;
  END LOOP;
END $$;

-- Fix #10a: Add Seated Cable Row 3×12 to Heavy Push + Pull days (pull volume)
DO $$
DECLARE
  r RECORD;
  new_ex jsonb;
  i int;
  last_idx int;
  cable_row jsonb := '{"name":"Seated Cable Row","detail":"3×12 — Full stretch forward, squeeze shoulder blades back. RIR: 2.","group":"F","reps":12,"sets":3,"rest":60,"type":"exercise"}'::jsonb;
BEGIN
  FOR r IN
    SELECT id, exercises FROM program_days
    WHERE program_id = 'dad0b0d0-1234-5678-9012-123456789012'
    AND label = 'Heavy Push + Pull'
    AND exercises::text NOT LIKE '%Seated Cable Row%'
  LOOP
    last_idx := jsonb_array_length(r.exercises) - 1;
    new_ex := '[]'::jsonb;
    FOR i IN 0..last_idx LOOP
      IF i = last_idx THEN
        new_ex := new_ex || jsonb_build_array(cable_row);
      END IF;
      new_ex := new_ex || jsonb_build_array(r.exercises->i);
    END LOOP;
    UPDATE program_days SET exercises = new_ex WHERE id = r.id;
  END LOOP;
END $$;

-- Fix #10b: Add Face Pull 3×15 to Hypertrophy Upper days (pull balance)
DO $$
DECLARE
  r RECORD;
  new_ex jsonb;
  i int;
  last_idx int;
  face_pull jsonb := '{"name":"Face Pull","detail":"3×15 — External rotate at top, squeeze rear delts. Shoulder health.","group":"E","reps":15,"sets":3,"rest":60,"type":"exercise"}'::jsonb;
BEGIN
  FOR r IN
    SELECT id, exercises FROM program_days
    WHERE program_id = 'dad0b0d0-1234-5678-9012-123456789012'
    AND label = 'Hypertrophy Upper'
    AND exercises::text NOT LIKE '%Face Pull%'
  LOOP
    last_idx := jsonb_array_length(r.exercises) - 1;
    new_ex := '[]'::jsonb;
    FOR i IN 0..last_idx LOOP
      IF i = last_idx THEN
        new_ex := new_ex || jsonb_build_array(face_pull);
      END IF;
      new_ex := new_ex || jsonb_build_array(r.exercises->i);
    END LOOP;
    UPDATE program_days SET exercises = new_ex WHERE id = r.id;
  END LOOP;
END $$;

-- ==========================================
-- ATHLETE PROGRAM FIXES
-- ==========================================

-- Fix #4a: Add Speed Bench Press 3×3 to START of Upper Strength days
DO $$
DECLARE
  r RECORD;
  speed_bench jsonb := '{"name":"Speed Bench Press","detail":"3×3 @ 50–60% 1RM — Maximum bar speed, explosive intent. RPE 6–7. Neural priming for working sets.","group":"S","reps":3,"sets":3,"rest":60,"type":"exercise"}'::jsonb;
BEGIN
  FOR r IN
    SELECT id, exercises FROM program_days
    WHERE program_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    AND label = 'Upper Strength'
    AND exercises::text NOT LIKE '%Speed Bench Press%'
  LOOP
    UPDATE program_days
    SET exercises = jsonb_build_array(speed_bench) || r.exercises
    WHERE id = r.id;
  END LOOP;
END $$;

-- Fix #4b: Add Speed Back Squat 3×3 to START of Lower Strength days
DO $$
DECLARE
  r RECORD;
  speed_squat jsonb := '{"name":"Speed Back Squat","detail":"3×3 @ 50–60% 1RM — Explosive out of the hole, maximum velocity. RPE 6–7. Neural priming.","group":"S","reps":3,"sets":3,"rest":60,"type":"exercise"}'::jsonb;
BEGIN
  FOR r IN
    SELECT id, exercises FROM program_days
    WHERE program_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    AND label = 'Lower Strength'
    AND exercises::text NOT LIKE '%Speed Back Squat%'
  LOOP
    UPDATE program_days
    SET exercises = jsonb_build_array(speed_squat) || r.exercises
    WHERE id = r.id;
  END LOOP;
END $$;

-- Fix #1: Add Chin-ups 3×6 to Upper Strength days (before last exercise)
DO $$
DECLARE
  r RECORD;
  new_ex jsonb;
  i int;
  last_idx int;
  chinups jsonb := '{"name":"Chin-ups","detail":"3×6 — Full ROM, controlled eccentric. Supinated grip for lat + bicep emphasis. Critical for vertical pull volume.","group":"E","reps":6,"sets":3,"rest":90,"type":"exercise"}'::jsonb;
BEGIN
  FOR r IN
    SELECT id, exercises FROM program_days
    WHERE program_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    AND label = 'Upper Strength'
    AND exercises::text NOT LIKE '%Chin-ups%'
  LOOP
    last_idx := jsonb_array_length(r.exercises) - 1;
    new_ex := '[]'::jsonb;
    FOR i IN 0..last_idx LOOP
      IF i = last_idx THEN
        new_ex := new_ex || jsonb_build_array(chinups);
      END IF;
      new_ex := new_ex || jsonb_build_array(r.exercises->i);
    END LOOP;
    UPDATE program_days SET exercises = new_ex WHERE id = r.id;
  END LOOP;
END $$;

-- Fix #6: Add Single Arm DB Row 3×12 to Upper Strength days (pull volume)
DO $$
DECLARE
  r RECORD;
  new_ex jsonb;
  i int;
  last_idx int;
  sa_row jsonb := '{"name":"Single Arm DB Row","detail":"3×12 each — Squeeze at top, controlled eccentric. High-ROI pulling movement.","group":"F","reps":12,"sets":3,"rest":60,"type":"exercise"}'::jsonb;
BEGIN
  FOR r IN
    SELECT id, exercises FROM program_days
    WHERE program_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    AND label = 'Upper Strength'
    AND exercises::text NOT LIKE '%Single Arm DB Row%'
  LOOP
    last_idx := jsonb_array_length(r.exercises) - 1;
    new_ex := '[]'::jsonb;
    FOR i IN 0..last_idx LOOP
      IF i = last_idx THEN
        new_ex := new_ex || jsonb_build_array(sa_row);
      END IF;
      new_ex := new_ex || jsonb_build_array(r.exercises->i);
    END LOOP;
    UPDATE program_days SET exercises = new_ex WHERE id = r.id;
  END LOOP;
END $$;

-- Fix #2: Add DB Lateral Raise 3×15 to Upper Strength days (additional side delt volume)
DO $$
DECLARE
  r RECORD;
  new_ex jsonb;
  i int;
  last_idx int;
  lat_raise jsonb := '{"name":"DB Lateral Raise","detail":"3×15 — Light weight, constant tension. Side delt volume supplement. RIR: 1.","group":"G","reps":15,"sets":3,"rest":45,"type":"exercise"}'::jsonb;
BEGIN
  FOR r IN
    SELECT id, exercises FROM program_days
    WHERE program_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    AND label = 'Upper Strength'
    AND exercises::text NOT LIKE '%DB Lateral Raise%'
  LOOP
    last_idx := jsonb_array_length(r.exercises) - 1;
    new_ex := '[]'::jsonb;
    FOR i IN 0..last_idx LOOP
      IF i = last_idx THEN
        new_ex := new_ex || jsonb_build_array(lat_raise);
      END IF;
      new_ex := new_ex || jsonb_build_array(r.exercises->i);
    END LOOP;
    UPDATE program_days SET exercises = new_ex WHERE id = r.id;
  END LOOP;
END $$;

-- Fix #3: Add Hammer Curl 2×12 + Rope Pushdown 2×12 to Upper Strength days (arm volume)
DO $$
DECLARE
  r RECORD;
  new_ex jsonb;
  i int;
  last_idx int;
  hammer_curl jsonb := '{"name":"Hammer Curl","detail":"2×12 — No swing, controlled tempo. Additional arm volume.","group":"H","reps":12,"sets":2,"rest":0,"type":"exercise","superset_label":"Superset"}'::jsonb;
  rope_push jsonb := '{"name":"Rope Pushdown","detail":"2×12 — Split rope at bottom, squeeze triceps. Additional arm volume.","group":"H","reps":12,"sets":2,"rest":60,"type":"exercise"}'::jsonb;
BEGIN
  FOR r IN
    SELECT id, exercises FROM program_days
    WHERE program_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    AND label = 'Upper Strength'
    AND exercises::text NOT LIKE '%Hammer Curl%'
  LOOP
    last_idx := jsonb_array_length(r.exercises) - 1;
    new_ex := '[]'::jsonb;
    FOR i IN 0..last_idx LOOP
      IF i = last_idx THEN
        new_ex := new_ex || jsonb_build_array(hammer_curl);
        new_ex := new_ex || jsonb_build_array(rope_push);
      END IF;
      new_ex := new_ex || jsonb_build_array(r.exercises->i);
    END LOOP;
    UPDATE program_days SET exercises = new_ex WHERE id = r.id;
  END LOOP;
END $$;

-- Fix #7: Add Nordic Curl 2×6 to Lower Strength days (hamstring injury prevention)
DO $$
DECLARE
  r RECORD;
  new_ex jsonb;
  i int;
  last_idx int;
  nordic jsonb := '{"name":"Nordic Curl","detail":"2×6 — Eccentric focus. Control the descent as slowly as possible. Critical for hamstring injury prevention.","group":"E","reps":6,"sets":2,"rest":90,"type":"exercise"}'::jsonb;
BEGIN
  FOR r IN
    SELECT id, exercises FROM program_days
    WHERE program_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    AND label = 'Lower Strength'
    AND exercises::text NOT LIKE '%Nordic Curl%'
  LOOP
    last_idx := jsonb_array_length(r.exercises) - 1;
    new_ex := '[]'::jsonb;
    FOR i IN 0..last_idx LOOP
      IF i = last_idx THEN
        new_ex := new_ex || jsonb_build_array(nordic);
      END IF;
      new_ex := new_ex || jsonb_build_array(r.exercises->i);
    END LOOP;
    UPDATE program_days SET exercises = new_ex WHERE id = r.id;
  END LOOP;
END $$;

-- Fix #5 (Athlete): Add 5-min AMRAP to Core + Conditioning days (glycolytic capacity)
DO $$
DECLARE
  r RECORD;
  amrap jsonb := '{"name":"Glycolytic Density Block","detail":"5-Minute AMRAP:\n• 8 KB Swings\n• 6 Push-Ups\n• 4 Burpees\n\nMaximum effort. Record rounds. Builds glycolytic capacity outside Day 6.","sets":1,"type":"exercise"}'::jsonb;
BEGIN
  FOR r IN
    SELECT id, exercises FROM program_days
    WHERE program_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    AND label = 'Core + Conditioning'
    AND exercises::text NOT LIKE '%Glycolytic Density Block%'
  LOOP
    UPDATE program_days
    SET exercises = r.exercises || jsonb_build_array(amrap)
    WHERE id = r.id;
  END LOOP;
END $$;
