
-- Helper function for exercise replacement
CREATE OR REPLACE FUNCTION _fix_tc_exercise(
  _days int[], _old_name text, _new_name text, _new_detail text
) RETURNS void AS $$
DECLARE
  _pid uuid;
  _d int;
  _ex jsonb;
  _i int;
BEGIN
  SELECT id INTO _pid FROM programs WHERE name = 'M2F Dad Bod Transformation Challenge';
  IF _pid IS NULL THEN RETURN; END IF;
  FOREACH _d IN ARRAY _days LOOP
    SELECT exercises INTO _ex FROM program_days WHERE program_id = _pid AND day_number = _d;
    IF _ex IS NULL THEN CONTINUE; END IF;
    FOR _i IN 0..jsonb_array_length(_ex)-1 LOOP
      IF _ex->_i->>'name' = _old_name THEN
        _ex = jsonb_set(_ex, ARRAY[_i::text, 'name'], to_jsonb(_new_name));
        _ex = jsonb_set(_ex, ARRAY[_i::text, 'detail'], to_jsonb(_new_detail));
      END IF;
    END LOOP;
    UPDATE program_days SET exercises = _ex WHERE program_id = _pid AND day_number = _d;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fix 1: Phase 1 Day 5 (pos 5) — Lying Leg Curl → Slider Leg Curl
-- Days: 5, 12, 19, 26
SELECT _fix_tc_exercise(ARRAY[5,12,19,26],
  'C2. Lying Leg Curl', 'C2. Slider Leg Curl',
  'Feet on sliders or towels. Extend and curl back. Hamstring eccentric focus. Controlled.');

-- Fix 2: Phase 2 Day 2 (pos 2) — Sumo Deadlift → DB Stiff-Leg Deadlift
-- Days: 30, 37, 44, 51
SELECT _fix_tc_exercise(ARRAY[30,37,44,51],
  'C1. Sumo Deadlift', 'C1. DB Stiff-Leg Deadlift',
  'Dumbbells. Hinge at hips. Deep hamstring stretch. Slight knee bend.');

-- Fix 3: Phase 2 Day 5 (pos 5) — GHR or Nordic Curl → Stability Ball Leg Curl
-- Days: 33, 40, 47, 54
SELECT _fix_tc_exercise(ARRAY[33,40,47,54],
  'C2. GHR or Nordic Curl', 'C2. Stability Ball Leg Curl',
  'Feet on ball. Bridge up, curl ball toward glutes. Slow eccentric.');

-- Fix 4: Phase 3 Day 5 (pos 5) — Lying Hamstring Curl → Single-Leg Slider Curl
-- Days: 61, 68, 75, 82
SELECT _fix_tc_exercise(ARRAY[61,68,75,82],
  'C2. Lying Hamstring Curl', 'C2. Single-Leg Slider Curl',
  'One foot on slider. Bridge and curl. Each leg. Slow eccentric. Full contraction.');

-- Cleanup
DROP FUNCTION _fix_tc_exercise;
