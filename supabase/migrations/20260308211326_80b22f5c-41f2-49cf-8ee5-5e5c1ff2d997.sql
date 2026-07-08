
-- Clean exercise detail text: strip "NxN —" prefix, tempo, RIR, RPE, [DELOAD] tags
-- This leaves just the coaching cue text
UPDATE program_days SET exercises = (
  SELECT jsonb_agg(
    CASE 
      WHEN (elem->>'type') = 'exercise' THEN
        jsonb_set(elem, '{detail}', 
          to_jsonb(
            trim(both ' ,—–-' from
              regexp_replace(
                regexp_replace(
                  regexp_replace(
                    regexp_replace(
                      regexp_replace(
                        regexp_replace(
                          elem->>'detail',
                          '^\d+\s*[×x]\s*\d+(/side)?\s*[—–-]\s*', '', 'i'  -- strip "4x6 — " prefix
                        ),
                        '\[DELOAD\]', '', 'gi'  -- strip [DELOAD]
                      ),
                      ',?\s*RIR\s*\d[\d-]*', '', 'gi'  -- strip RIR references
                    ),
                    'Tempo\s*[:=]?\s*\d{4},?\s*', '', 'gi'  -- strip Tempo 2010
                  ),
                  'RPE\s*\d[\d.-]*,?\s*', '', 'gi'  -- strip RPE 7-8
                ),
                '\s{2,}', ' ', 'g'  -- collapse whitespace
              )
            )
          )
        )
      ELSE elem
    END
  )
  FROM jsonb_array_elements(exercises) AS elem
);
