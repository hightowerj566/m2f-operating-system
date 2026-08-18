DO $$
DECLARE
  r RECORD;
  dow int;
  wk int;
  fin jsonb;
  idx int;
  arr jsonb;
  new_arr jsonb;
  el jsonb;
  inserted boolean;
  names text[];
  details text[];
  reps text[];
BEGIN
  FOR r IN
    SELECT id, day_number, exercises
    FROM program_days
    WHERE program_id = 'd7a417b5-bdb6-4c2c-a91a-be89b278b2ca'
      AND day_number <= 42
  LOOP
    dow := ((r.day_number - 1) % 7) + 1;
    wk := ceil(r.day_number / 7.0);
    IF dow NOT IN (1,2,4,5) THEN CONTINUE; END IF;
    IF r.exercises::text ILIKE '%"conditioning"%' THEN CONTINUE; END IF;

    IF dow = 1 THEN
      names := ARRAY['Z. Power Finisher — Assault Bike Sprints','Z. Power Finisher — Sled Push','Z. Power Finisher — Rower Sprints'];
      details := ARRAY[
        '10s max effort / 50s easy spin. RPE 9 on the work, full recovery between. Stop if power drops off.',
        '20m heavy push / walk back recovery. RPE 8-9. Drive through the legs, stay low.',
        '15s max effort / 45s easy. RPE 9. Explode off the drive, reset your posture each round.'];
      reps := ARRAY['6 rounds','6 rounds','6 rounds'];
    ELSIF dow = 2 THEN
      names := ARRAY['Z. Engine Finisher — Bike Intervals','Z. Engine Finisher — Row Intervals','Z. Engine Finisher — Ski Erg Intervals'];
      details := ARRAY[
        '30s hard / 30s easy. RPE 7-8, HR 155-170 BPM. Hold the same output every round.',
        '250m strong / 60s easy. RPE 7-8. Hold a consistent split across all rounds.',
        '30s work / 30s easy. RPE 7-8. Full hip hinge on every pull.'];
      reps := ARRAY['8 min','8 min','8 min'];
    ELSIF dow = 4 THEN
      names := ARRAY['Z. Loaded Capacity — Farmer Carry Circuit','Z. Loaded Capacity — KB Swing EMOM','Z. Loaded Capacity — Sandbag/Sled Complex'];
      details := ARRAY[
        '40m heavy farmer carry, 60s rest. RPE 7-8. Tall chest, braced ribs, no shrugging.',
        'EMOM: 12 kettlebell swings (moderate-heavy). Rest the remainder of each minute. RPE 8.',
        '20m sled push + 20m sandbag/DB carry, 60s rest. RPE 8. Steady breathing under load.'];
      reps := ARRAY['5 rounds','8 min','5 rounds'];
    ELSE
      names := ARRAY['Z. Mixed Modal Finisher','Z. Mixed Modal Finisher — Bike/Carry','Z. Mixed Modal Finisher — Row/Swing'];
      details := ARRAY[
        '30s bike + 30s row, alternating, 40s rest. RPE 7-8. Smooth transitions, no sprint-outs.',
        '45s bike hard + 30m carry, 60s rest. RPE 7-8. Keep the carry unbroken.',
        '250m row + 15 kettlebell swings, 60s rest. RPE 7-8. Pace the row so the swings stay clean.'];
      reps := ARRAY['8 min','5 rounds','5 rounds'];
    END IF;

    idx := ((wk - 1) % 3) + 1;
    fin := jsonb_build_object(
      'name', names[idx],
      'detail', details[idx],
      'sets', 1,
      'reps', reps[idx],
      'rest', NULL,
      'rir', NULL,
      'type', 'conditioning',
      'group', NULL,
      'superset_label', NULL
    );

    arr := r.exercises;
    new_arr := '[]'::jsonb;
    inserted := false;
    FOR el IN SELECT * FROM jsonb_array_elements(arr) LOOP
      IF NOT inserted AND (el->>'type') IN ('mindset','mission','rest') THEN
        new_arr := new_arr || fin;
        inserted := true;
      END IF;
      new_arr := new_arr || el;
    END LOOP;
    IF NOT inserted THEN
      new_arr := new_arr || fin;
    END IF;

    UPDATE program_days SET exercises = new_arr WHERE id = r.id;
  END LOOP;
END $$;