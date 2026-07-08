-- Add activity-related columns to profiles for TDEE calculation
ALTER TABLE public.profiles
ADD COLUMN avg_daily_steps integer DEFAULT NULL,
ADD COLUMN training_days_per_week integer DEFAULT NULL,
ADD COLUMN job_type text DEFAULT NULL;