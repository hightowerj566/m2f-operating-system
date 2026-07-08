
-- Add preferred weekly check-in day to profiles (0=Sunday, 1=Monday, ..., 6=Saturday)
ALTER TABLE public.profiles ADD COLUMN weekly_checkin_day INTEGER DEFAULT 0;
