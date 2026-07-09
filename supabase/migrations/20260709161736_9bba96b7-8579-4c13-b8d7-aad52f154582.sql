
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS training_profile_complete boolean NOT NULL DEFAULT false;

-- Backfill: anyone who already entered training data is considered complete
UPDATE public.profiles
SET training_profile_complete = true
WHERE weight_lbs IS NOT NULL
   OR height_inches IS NOT NULL
   OR body_fat_pct IS NOT NULL;
