
-- Create table for quiz leads (public, no auth required)
CREATE TABLE public.father_athlete_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  archetype_type TEXT NOT NULL,
  quiz_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  source TEXT NOT NULL DEFAULT 'Lovable Quiz',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.father_athlete_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public quiz, no login)
CREATE POLICY "Anyone can submit quiz leads"
  ON public.father_athlete_leads
  FOR INSERT
  WITH CHECK (true);

-- Only coaches can view leads
CREATE POLICY "Coaches can view leads"
  ON public.father_athlete_leads
  FOR SELECT
  USING (public.has_role(auth.uid(), 'coach'::app_role));
