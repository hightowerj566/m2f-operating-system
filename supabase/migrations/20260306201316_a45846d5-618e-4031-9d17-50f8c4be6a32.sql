
-- Table to track active Stripe subscriptions server-side
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  product_id text,
  current_period_end timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions (user_id);
CREATE INDEX idx_user_subscriptions_stripe_sub ON public.user_subscriptions (stripe_subscription_id);

-- RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Coaches can view all
CREATE POLICY "Coaches can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'coach'));

-- Only service role (edge functions) can insert/update/delete — no user policies for mutation

-- Security definer function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = _user_id
      AND status IN ('active', 'trialing')
  )
$$;

-- Tighten program_assignments INSERT: require subscription OR coach role
DROP POLICY IF EXISTS "Users can insert own assignments" ON public.program_assignments;
CREATE POLICY "Users can insert own assignments"
  ON public.program_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      public.has_active_subscription(auth.uid())
      OR public.has_role(auth.uid(), 'coach')
    )
  );
