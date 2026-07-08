
-- Fix chest volume deficit: add chest exercise to Arms/Conditioning day (Day 3 equivalent)
-- This brings weekly chest from ~10 to ~13 effective sets

-- Helper function
CREATE OR REPLACE FUNCTION _m2f_add(
  p_prog text, p_label text, p_ex jsonb, p_deload_ex jsonb DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE r record; is_dl boolean;
BEGIN
  FOR r IN SELECT pd.id, pd.label FROM program_days pd
    JOIN programs p ON p.id = pd.program_id
    WHERE p.name = p_prog AND pd.label ILIKE p_label
  LOOP
    is_dl := r.label ILIKE '%deload%';
    IF is_dl AND p_deload_ex IS NOT NULL THEN
      UPDATE program_days SET exercises = exercises || jsonb_build_array(p_deload_ex) WHERE id = r.id;
    ELSIF NOT is_dl THEN
      UPDATE program_days SET exercises = exercises || jsonb_build_array(p_ex) WHERE id = r.id;
    END IF;
  END LOOP;
END; $$;

DO $$ BEGIN
  -- Rebuild: Add DB Fly to Arms day (3x15, pump-focused, fits hypertrophy emphasis)
  PERFORM _m2f_add('M2F Rebuild', '%Arms%',
    '{"name":"C3. DB Fly","detail":"Slight bend in elbows. Deep stretch. Squeeze at top.","type":"exercise","sets":3,"reps":15,"rest":60,"group":"add_chest"}'::jsonb,
    '{"name":"C3. DB Fly","detail":"Light. Full stretch.","type":"exercise","sets":2,"reps":15,"rest":60,"group":"add_chest"}'::jsonb);

  -- Perform: Add Weighted Dip to Arms day (3x8, compound, performance-oriented)
  PERFORM _m2f_add('M2F Perform', '%Arms%',
    '{"name":"C3. Weighted Dip","detail":"Slight forward lean for chest. Full depth. Lock out.","type":"exercise","sets":3,"reps":8,"rest":60,"group":"add_chest"}'::jsonb,
    '{"name":"C3. Weighted Dip","detail":"Bodyweight only. Controlled.","type":"exercise","sets":2,"reps":10,"rest":60,"group":"add_chest"}'::jsonb);
END $$;

DROP FUNCTION _m2f_add;
