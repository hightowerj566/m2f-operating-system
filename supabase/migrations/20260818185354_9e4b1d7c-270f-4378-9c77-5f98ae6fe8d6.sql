-- Reorder the M2F Forge week so the Zone 2 / active-recovery day lands on day 3
-- (Wednesday) and push conditioning to the bottom of every day's item list.
WITH src AS (
  SELECT day_number, label, exercises
  FROM public.program_days
  WHERE program_id = 'd7a417b5-bdb6-4c2c-a91a-be89b278b2ca' AND day_number <= 42
),
mapped AS (
  SELECT day_number,
    CASE ((day_number - 1) % 7) + 1
      WHEN 3 THEN day_number + 3   -- new day 3 pulls the old active-recovery day
      WHEN 4 THEN day_number - 1
      WHEN 5 THEN day_number - 1
      WHEN 6 THEN day_number - 1
      ELSE day_number
    END AS source_day
  FROM src
),
resolved AS (
  SELECT m.day_number,
    regexp_replace(s.label, '^Day\s*\d+', 'Day ' || (((m.day_number - 1) % 7) + 1)) AS label,
    (
      SELECT COALESCE(jsonb_agg(e.x ORDER BY
        CASE e.x->>'type'
          WHEN 'warmup' THEN 0
          WHEN 'conditioning' THEN 2
          WHEN 'mindset' THEN 3
          WHEN 'mission' THEN 4
          ELSE 1
        END, e.ord), '[]'::jsonb)
      FROM jsonb_array_elements(s.exercises) WITH ORDINALITY e(x, ord)
    ) AS exercises
  FROM mapped m
  JOIN src s ON s.day_number = m.source_day
)
UPDATE public.program_days t
SET label = r.label, exercises = r.exercises
FROM resolved r
WHERE t.program_id = 'd7a417b5-bdb6-4c2c-a91a-be89b278b2ca' AND t.day_number = r.day_number;