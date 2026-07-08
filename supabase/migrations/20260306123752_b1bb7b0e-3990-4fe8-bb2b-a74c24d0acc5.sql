
-- Restrict subscription_settings to coaches only
DROP POLICY IF EXISTS "Authenticated users can view subscription settings" ON public.subscription_settings;
