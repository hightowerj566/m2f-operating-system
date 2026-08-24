DO $$
DECLARE
  pid uuid := 'd7a417b5-bdb6-4c2c-a91a-be89b278b2ca';
  rec record;
  pos int; meso int;
  cond jsonb; main jsonb; tail jsonb;
  blocks jsonb := '{
   "1": {
     "1": {"name":"EMOM 10 — Power Finisher","reps":"10 min","detail":"• Odd minutes: 12 KB Swings (moderate-heavy, hip-driven, chest height)\n• Even minutes: 6 Medicine-Ball Slams or 5 Rotational Throws per side\nMove fast, then rest the remainder of each minute."},
     "2": {"name":"Row Intervals — 8 Rounds","reps":"16 min","detail":"• 1 min Row @ RPE 8\n• 1 min Row easy @ RPE 4\nNo dismount — stay on the machine for all 16 minutes."},
     "4": {"name":"Loaded Carry Complex — 4 Rounds for Quality","reps":"4 rounds","detail":"• 20 m Heavy Sled Push\n• 40 m Farmer Carry, heaviest load, unbroken\nRest 90s between rounds. Stop a round if grip or posture breaks."},
     "5": {"name":"AMRAP 8","reps":"8 min","detail":"• 6 Dumbbell Clean & Press (moderate)\n• 10 Push-Ups\n• 200 m Row or 250 m Bike\nSteady, repeatable pace — no round should be more than 15s slower than your first."}
   },
   "2": {
     "1": {"name":"EMOM 10 — Power Finisher","reps":"10 min","detail":"• Odd minutes: 10 KB Swings (heavy)\n• Even minutes: 4 Broad Jumps, soft landings, reset each rep\nQuality of the jump beats speed."},
     "2": {"name":"Bike or Ski Erg Intervals — 10 Rounds","reps":"10 min","detail":"• 20s hard effort @ RPE 8-9\n• 40s easy spin @ RPE 4\n10 hard efforts total."},
     "4": {"name":"4 Rounds for Quality","reps":"4 rounds","detail":"• 40 m Farmer Carry (heavy)\n• 8 Dumbbell Push Press (moderate)\nRest 90s between rounds."},
     "5": {"name":"AMRAP 8","reps":"8 min","detail":"• 8 Push-Ups\n• 12/10 cal Bike or Row\n• 20 m Sandbag or Dumbbell Front-Rack Carry\nLow impact by design — Day 1 already carries this week impact work."}
   },
   "3": {
     "1": {"name":"EMOM 10 — Power Finisher","reps":"10 min","detail":"• Odd minutes: 3 Trap-Bar Jumps or 4 Box Jumps, step down\n• Even minutes: 10 KB Swings (heavy)\nStep down from every box jump — never rebound."},
     "2": {"name":"Rower, Bike or Ski Intervals — 8 Rounds","reps":"16 min","detail":"• 30s hard @ RPE 8\n• 90s easy @ RPE 4\nPick one machine and stay on it."},
     "4": {"name":"4 Rounds for Quality","reps":"4 rounds","detail":"• 30 m Heavy Sled Push\n• 30 m Farmer Carry\nRest 90s between rounds."},
     "5": {"name":"AMRAP 10","reps":"10 min","detail":"• 250 m Row\n• 10 Dumbbell Push Press\n• 10 Push-Ups\n• 20 m Front-Rack Carry\nHold a pace you could repeat for a second round."}
   },
   "4": {
     "1": {"name":"EMOM 10 — Power Finisher","reps":"10 min","detail":"• Odd minutes: 20 m Sled Sprint (under 30% bodyweight) or 20 m Hill/Flat Sprint\n• Even minutes: 4 Broad Jumps, reset each rep\nFull intent on every sprint."},
     "2": {"name":"Rower or Bike Intervals — 6 Rounds","reps":"18 min","detail":"• 500 m Row or 1000 m Bike @ RPE 8\n• 2 min easy @ RPE 4\nRecord your splits — they should stay within 5 seconds of each other."},
     "4": {"name":"4 Rounds for Quality","reps":"4 rounds","detail":"• 40 m Farmer Carry (heavy)\n• 6 Sandbag Ground-to-Shoulder, alternating (or 8 Dumbbell High Pulls)\nRest 90s between rounds."},
     "5": {"name":"AMRAP 10","reps":"10 min","detail":"• 5 Dumbbell Hang Clean & Jerk (moderate)\n• 8 Push-Ups\n• 12/10 cal Bike or Row\n• 20 m Farmer Carry\nLow impact by design — Day 1 already carries this week impact work."}
   },
   "5": {
     "1": {"name":"EMOM 10 — Power Finisher","reps":"10 min","detail":"• Odd minutes: 10 KB Swings (heavy)\n• Even minutes: 6 Medicine-Ball Slams\nExplosive hips, controlled reset."},
     "2": {"name":"Rower or Bike Intervals — 10 Rounds","reps":"20 min","detail":"• 40s hard @ RPE 8\n• 80s easy @ RPE 4\nNon-impact machines only this block."},
     "4": {"name":"5 Rounds for Quality","reps":"5 rounds","detail":"• 40 m Farmer Carry (heavy)\n• 8 Dumbbell Push Press\nRest 90s between rounds."},
     "5": {"name":"AMRAP 8","reps":"8 min","detail":"• 8 Push-Ups\n• 12/10 cal Bike or Row\n• 20 m Front-Rack Carry\nSmooth transitions — the clock rewards not stopping."}
   },
   "6": {
     "1": {"name":"EMOM 10 — Power Finisher","reps":"10 min","detail":"• Odd minutes: 20 m Sprint or Sled Sprint\n• Even minutes: 8 KB Swings (heavy)\nPeak block — every effort is max intent."},
     "2": {"name":"Benchmark Retest — 2000 m Row for Time","reps":"for time","detail":"• 2000 m Row, all out\nSame benchmark you set in Meso 1. Record your time and split, then compare."},
     "4": {"name":"5 Rounds for Quality","reps":"5 rounds","detail":"• 20 m Sled Push\n• 40 m Farmer Carry\nRest 90s between rounds."},
     "5": {"name":"AMRAP 8","reps":"8 min","detail":"• 6 Dumbbell Clean & Press\n• 10 Push-Ups\n• 200 m Row\nFinal block — beat your Meso 1 round count."}
   }
  }'::jsonb;
BEGIN
  FOR rec IN SELECT id, day_number, exercises FROM public.program_days WHERE program_id = pid ORDER BY day_number LOOP
    pos := ((rec.day_number - 1) % 7) + 1;
    meso := LEAST(6, CEIL(rec.day_number / 28.0)::int);
    IF pos NOT IN (1,2,4,5) THEN CONTINUE; END IF;
    cond := blocks -> meso::text -> pos::text;
    IF cond IS NULL THEN CONTINUE; END IF;

    WITH kept AS (
      SELECT e, ord FROM jsonb_array_elements(rec.exercises) WITH ORDINALITY t(e, ord)
      WHERE (e->>'sets') IS NOT NULL
    ), counted AS (
      SELECT e, ord, COUNT(*) FILTER (WHERE true) OVER (PARTITION BY e->>'group') AS grp_n FROM kept
    )
    SELECT
      COALESCE(jsonb_agg(CASE WHEN grp_n = 1 THEN jsonb_set(e,'{superset_label}','null'::jsonb) ELSE e END ORDER BY ord)
        FILTER (WHERE (e->>'type') NOT IN ('mindset','mission')), '[]'::jsonb),
      COALESCE(jsonb_agg(e ORDER BY ord) FILTER (WHERE (e->>'type') IN ('mindset','mission')), '[]'::jsonb)
    INTO main, tail
    FROM counted;

    UPDATE public.program_days
    SET exercises = main
      || jsonb_build_array(jsonb_build_object(
           'name', cond->>'name',
           'detail', cond->>'detail',
           'sets', 1,
           'reps', cond->>'reps',
           'rest', NULL,
           'rir', NULL,
           'type', 'conditioning',
           'group', 'CONDITIONING',
           'superset_label', NULL))
      || tail
    WHERE id = rec.id;
  END LOOP;
END $$;