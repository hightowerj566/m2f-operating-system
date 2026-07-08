
-- Store coach's subscription settings (active Stripe price)
CREATE TABLE public.subscription_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  stripe_price_id text NOT NULL,
  stripe_product_id text NOT NULL,
  amount_cents integer NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage subscription settings"
ON public.subscription_settings FOR ALL
USING (has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Authenticated users can view subscription settings"
ON public.subscription_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_subscription_settings_updated_at
BEFORE UPDATE ON public.subscription_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
