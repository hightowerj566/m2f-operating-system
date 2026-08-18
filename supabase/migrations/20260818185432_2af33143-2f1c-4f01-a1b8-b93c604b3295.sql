-- Name the Forge Zone 2 day explicitly so it renders as conditioning.
UPDATE public.program_days d
SET label = 'Day 3 — Zone 2 Conditioning + Mobility',
    exercises = (
      SELECT jsonb_agg(
        CASE WHEN x->>'name' = 'Active Recovery'
          THEN jsonb_set(x, '{name}', '"Zone 2 Conditioning"'::jsonb)
          ELSE x END
        ORDER BY ord)
      FROM jsonb_array_elements(d.exercises) WITH ORDINALITY t(x, ord)
    )
WHERE d.program_id = 'd7a417b5-bdb6-4c2c-a91a-be89b278b2ca'
  AND d.day_number <= 42
  AND d.exercises @> '[{"name":"Active Recovery"}]'::jsonb;