
-- Helper function to replace the Nth occurrence of an exercise by name
CREATE OR REPLACE FUNCTION _fix_exercise(
  _prog text, _days int[], _old_name text, _new_name text, _new_detail text, _which int DEFAULT 1
) RETURNS void AS $$
DECLARE
  _pid uuid;
  _d int;
  _ex jsonb;
  _i int;
  _count int;
BEGIN
  SELECT id INTO _pid FROM programs WHERE name = _prog;
  IF _pid IS NULL THEN RETURN; END IF;
  FOREACH _d IN ARRAY _days LOOP
    SELECT exercises INTO _ex FROM program_days WHERE program_id = _pid AND day_number = _d;
    IF _ex IS NULL THEN CONTINUE; END IF;
    _count := 0;
    FOR _i IN 0..jsonb_array_length(_ex)-1 LOOP
      IF _ex->_i->>'name' = _old_name THEN
        _count := _count + 1;
        IF _count = _which THEN
          _ex = jsonb_set(_ex, ARRAY[_i::text, 'name'], to_jsonb(_new_name));
          _ex = jsonb_set(_ex, ARRAY[_i::text, 'detail'], to_jsonb(_new_detail));
        END IF;
      END IF;
    END LOOP;
    UPDATE program_days SET exercises = _ex WHERE program_id = _pid AND day_number = _d;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════
-- FIX 1: Band External Rotation same-day duplicate (A2 + D3)
-- Replace 2nd occurrence (D3) with Prone I-Y-T Raise
-- Affects day position 4 in ALL phases of BOTH programs
-- ══════════════════════════════════════════════════════════════
SELECT _fix_exercise('M2F Rebuild', ARRAY[4,11,18,25,32,39,46,53,60,67,74,81,88,95,102,109],
  'D3. Band External Rotation', 'D3. Prone I-Y-T Raise',
  'Face down on incline bench. Thumbs up. Raise arms in I, Y, then T pattern. Light weight. 5 reps each shape.', 1);

SELECT _fix_exercise('M2F Perform', ARRAY[4,11,18,25,32,39,46,53,60,67,74,81,88,95,102,109],
  'D3. Band External Rotation', 'D3. Prone I-Y-T Raise',
  'Face down on incline bench. Thumbs up. Raise arms in I, Y, then T pattern. Light weight. 5 reps each shape.', 1);

-- ══════════════════════════════════════════════════════════════
-- FIX 2: M2F Rebuild — Leg Curl duplicates (pos 2 + pos 5)
-- Keep pos 2, replace pos 5 with variation
-- ══════════════════════════════════════════════════════════════
-- Phase 1: "B2. Leg Curl" on days 5,12,19,26
SELECT _fix_exercise('M2F Rebuild', ARRAY[5,12,19,26],
  'B2. Leg Curl', 'B2. Slider Leg Curl',
  'Feet on sliders or towels. Bridge up, extend legs, curl back in. Hamstring eccentric focus. Controlled.', 1);

-- Phase 2: "B2. Seated Leg Curl" on days 33,40,47,54
SELECT _fix_exercise('M2F Rebuild', ARRAY[33,40,47,54],
  'B2. Seated Leg Curl', 'B2. Banded Leg Curl',
  'Band anchored low. Prone or standing. Controlled curl to full contraction. Squeeze at top.', 1);

-- Phase 3 & 4: Apply slider/banded variants if leg curl duplicates exist
SELECT _fix_exercise('M2F Rebuild', ARRAY[61,68,75,82],
  'B2. Leg Curl', 'B2. Stability Ball Leg Curl',
  'Feet on stability ball. Bridge up, curl ball toward glutes. Slow eccentric. Control the ball.', 1);
SELECT _fix_exercise('M2F Rebuild', ARRAY[61,68,75,82],
  'B2. Seated Leg Curl', 'B2. Stability Ball Leg Curl',
  'Feet on stability ball. Bridge up, curl ball toward glutes. Slow eccentric. Control the ball.', 1);
SELECT _fix_exercise('M2F Rebuild', ARRAY[89,96,103,110],
  'B2. Leg Curl', 'B2. Single-Leg Slider Curl',
  'One foot on slider. Bridge and curl. Each leg. Slow eccentric. Full contraction.', 1);
SELECT _fix_exercise('M2F Rebuild', ARRAY[89,96,103,110],
  'B2. Seated Leg Curl', 'B2. Single-Leg Slider Curl',
  'One foot on slider. Bridge and curl. Each leg. Slow eccentric. Full contraction.', 1);
SELECT _fix_exercise('M2F Rebuild', ARRAY[89,96,103,110],
  'B2. Nordic Curl', 'B2. Single-Leg Slider Curl',
  'One foot on slider. Bridge and curl. Each leg. Slow eccentric. Full contraction.', 1);

-- ══════════════════════════════════════════════════════════════
-- FIX 3: M2F Perform — Phase 1 (days 1-27) duplicates
-- ══════════════════════════════════════════════════════════════

-- Close-Grip Bench Press 3x → keep Day 1 C1, fix Day 3 B2 and Day 4 D1
SELECT _fix_exercise('M2F Perform', ARRAY[3,10,17,24],
  'B2. Close-Grip Bench Press', 'B2. Dip',
  'Parallel bars. Upright torso for tricep emphasis. Full lockout. Tempo: 2010.', 1);

SELECT _fix_exercise('M2F Perform', ARRAY[4,11,18,25],
  'D1. Close-Grip Bench Press', 'D1. Overhead Tricep Extension',
  'EZ bar or dumbbell. Deep stretch behind head. Full lockout. Tempo: 2011.', 1);

-- Barbell Curl 3x → keep Day 3 B1, fix Day 4 D2 and Day 6 B1
SELECT _fix_exercise('M2F Perform', ARRAY[4,11,18,25],
  'D2. Barbell Curl', 'D2. Incline DB Curl',
  'Seated incline bench. Full stretch at bottom. Supinate at top. No swing.', 1);

SELECT _fix_exercise('M2F Perform', ARRAY[6,13,20,27],
  'B1. Barbell Curl', 'B1. EZ Bar Curl',
  'Cambered bar. Slight wrist relief. Strict form. Tempo: 2011. Squeeze at top.', 1);

-- Nordic Curl 2x → keep Day 2 D1, fix Day 5 B2
SELECT _fix_exercise('M2F Perform', ARRAY[5,12,19,26],
  'B2. Nordic Curl', 'B2. Slider Leg Curl',
  'Feet on sliders. Bridge up, extend legs out, curl back in. Hamstring eccentric focus. Controlled.', 1);

-- Pallof Press 2x → keep Day 1 D3, fix Day 3 D2
SELECT _fix_exercise('M2F Perform', ARRAY[3,10,17,24],
  'D2. Pallof Press', 'D2. Dead Bug',
  'Opposite arm/leg extension. Press low back into floor. Controlled breathing. Tempo: 2020.', 1);

-- DB Lateral Raise 2x → keep Day 1 D1, fix Day 4 C1
SELECT _fix_exercise('M2F Perform', ARRAY[4,11,18,25],
  'C1. DB Lateral Raise', 'C1. Cable Lateral Raise',
  'Behind-the-body cable start. Slight lean away. Constant tension throughout ROM. No momentum.', 1);

-- ══════════════════════════════════════════════════════════════
-- FIX 4: M2F Perform — Phase 2 (days 29-55) duplicates
-- ══════════════════════════════════════════════════════════════

-- Seated Leg Curl 2x → keep Day 30 D1, fix Day 33 B2
SELECT _fix_exercise('M2F Perform', ARRAY[33,40,47,54],
  'B2. Seated Leg Curl', 'B2. Stability Ball Leg Curl',
  'Feet on ball. Bridge up, curl ball toward glutes. Slow 3s eccentric. Full contraction.', 1);

-- Spider Curl 2x → keep Day 31 B1, fix Day 34 B1
SELECT _fix_exercise('M2F Perform', ARRAY[34,41,48,55],
  'B1. Spider Curl', 'B1. Incline DB Curl',
  'Seated incline. Full stretch at bottom. Supinate at top. Controlled tempo.', 1);

-- Dip 2x → keep Day 31 C2, fix Day 34 B2
SELECT _fix_exercise('M2F Perform', ARRAY[34,41,48,55],
  'B2. Dip', 'B2. Close-Grip Push-Up',
  'Hands inside shoulders. Full range. Elbows tucked tight. Tricep emphasis.', 1);

-- ══════════════════════════════════════════════════════════════
-- FIX 5: M2F Perform — Phase 3 (days 57-83) duplicates
-- ══════════════════════════════════════════════════════════════

-- EZ Bar Curl 2x → keep Day 59 B1, fix Day 62 B1
SELECT _fix_exercise('M2F Perform', ARRAY[62,69,76,83],
  'B1. EZ Bar Curl', 'B1. Reverse Curl',
  'Overhand grip. Forearm and brachialis emphasis. Controlled tempo. No swing.', 1);

-- ══════════════════════════════════════════════════════════════
-- FIX 6: M2F Perform — Phase 4 (days 85-111) duplicates
-- ══════════════════════════════════════════════════════════════

-- Barbell Curl 2x → keep Day 87 B1, fix Day 90 B1
SELECT _fix_exercise('M2F Perform', ARRAY[90,97,104,111],
  'B1. Barbell Curl', 'B1. Hammer Curl',
  'Neutral grip. Alternate arms. No body english. Squeeze at top. Tempo: 2011.', 1);

-- Nordic Curl 2x → keep Day 86 D1, fix Day 89 B2
SELECT _fix_exercise('M2F Perform', ARRAY[89,96,103,110],
  'B2. Nordic Curl', 'B2. Single-Leg Slider Curl',
  'One foot on slider. Bridge and curl. Each leg. Slow eccentric. Full contraction.', 1);

-- Pallof Press 2x → keep Day 85 D3, fix Day 87 D2
SELECT _fix_exercise('M2F Perform', ARRAY[87,94,101,108],
  'D2. Pallof Press', 'D2. Dead Bug',
  'Opposite arm/leg extension. Press low back into floor. Brace core. Controlled breathing.', 1);

-- Weighted Dip 2x → keep Day 87 B2, fix Day 90 B2
SELECT _fix_exercise('M2F Perform', ARRAY[90,97,104,111],
  'B2. Weighted Dip', 'B2. Overhead Tricep Extension',
  'Cable or dumbbell. Deep stretch behind head. Full lockout. Tempo: 2012.', 1);

-- Clean up helper function
DROP FUNCTION _fix_exercise;
