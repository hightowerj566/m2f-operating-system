ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS training_experience text,
  ADD COLUMN IF NOT EXISTS body_composition_category text,
  ADD COLUMN IF NOT EXISTS conditioning_level text,
  ADD COLUMN IF NOT EXISTS equipment_access text;