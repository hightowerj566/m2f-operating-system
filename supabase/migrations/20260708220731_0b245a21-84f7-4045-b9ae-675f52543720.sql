ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_child boolean,
  ADD COLUMN IF NOT EXISTS partner_name text,
  ADD COLUMN IF NOT EXISTS biggest_fear text,
  ADD COLUMN IF NOT EXISTS faith_practicing boolean,
  ADD COLUMN IF NOT EXISTS training_days smallint,
  ADD COLUMN IF NOT EXISTS session_length_min smallint,
  ADD COLUMN IF NOT EXISTS gym_access text;