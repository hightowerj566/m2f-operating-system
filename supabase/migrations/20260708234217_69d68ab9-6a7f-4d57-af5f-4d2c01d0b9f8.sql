ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS journey text CHECK (journey IN ('expecting','training')),
  ADD COLUMN IF NOT EXISTS training_experience text;