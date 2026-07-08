
CREATE TABLE public.cancellation_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  reason text NOT NULL,
  comments text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cancellation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback" ON public.cancellation_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can view all feedback" ON public.cancellation_feedback
  FOR SELECT USING (has_role(auth.uid(), 'coach'::app_role));
