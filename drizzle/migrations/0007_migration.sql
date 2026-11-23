CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  referrer_name text NOT NULL,
  referrer_contact text,
  payout_cents integer NOT NULL DEFAULT 1000,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX referral_codes_code_key ON public.referral_codes (upper(code));
GRANT SELECT, INSERT, UPDATE ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches view own codes, admins all" ON public.referral_codes FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR (created_by = auth.uid() AND public.is_coach_or_admin(auth.uid())));
CREATE POLICY "Coaches create codes" ON public.referral_codes FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_coach_or_admin(auth.uid()));
CREATE POLICY "Owners or admins update codes" ON public.referral_codes FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR (created_by = auth.uid() AND public.is_coach_or_admin(auth.uid())));

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.referral_codes(id),
  referred_user_id uuid NOT NULL UNIQUE,
  signed_up_at timestamptz NOT NULL DEFAULT now(),
  first_paid_at timestamptz,
  payout_cents integer
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Code owners view referrals" ON public.referrals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.referral_codes c WHERE c.id = code_id));

CREATE TABLE public.referral_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.referral_codes(id),
  month date NOT NULL,
  amount_cents integer NOT NULL,
  referral_count integer NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  paid_by uuid NOT NULL,
  UNIQUE (code_id, month)
);
GRANT SELECT, INSERT ON public.referral_payouts TO authenticated;
GRANT ALL ON public.referral_payouts TO service_role;
ALTER TABLE public.referral_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Code owners view payouts" ON public.referral_payouts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.referral_codes c WHERE c.id = code_id));
CREATE POLICY "Code owners record payouts" ON public.referral_payouts FOR INSERT TO authenticated
  WITH CHECK (paid_by = auth.uid() AND public.is_coach_or_admin(auth.uid())
    AND EXISTS (SELECT 1 FROM public.referral_codes c WHERE c.id = code_id));

CREATE OR REPLACE FUNCTION public.validate_referral_code(_code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.referral_codes WHERE upper(code) = upper(trim(_code)) AND is_active)
$$;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_referral_members(_code_ids uuid[])
RETURNS TABLE(id uuid, code_id uuid, display_name text, email text, signed_up_at timestamptz, first_paid_at timestamptz, payout_cents integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.code_id, p.display_name, u.email::text, r.signed_up_at, r.first_paid_at, r.payout_cents
  FROM public.referrals r
  JOIN public.referral_codes c ON c.id = r.code_id
  LEFT JOIN public.profiles p ON p.user_id = r.referred_user_id
  LEFT JOIN auth.users u ON u.id = r.referred_user_id
  WHERE r.code_id = ANY(_code_ids)
    AND (public.is_admin(auth.uid()) OR (c.created_by = auth.uid() AND public.is_coach_or_admin(auth.uid())))
$$;
REVOKE EXECUTE ON FUNCTION public.get_referral_members(uuid[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_referral_members(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_code_id uuid;
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT (user_id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.program_assignments WHERE user_id = NEW.id AND is_active) THEN
    INSERT INTO public.program_assignments (user_id, program_id, assigned_by, current_day, is_active, status, scheduled_start_date)
    VALUES (NEW.id, 'd7a417b5-bdb6-4c2c-a91a-be89b278b2ca', 'bd99286f-3d70-4c19-81c5-bbf94a040c9a', 1, true, 'active', CURRENT_DATE);
  END IF;

  BEGIN
    IF COALESCE(trim(NEW.raw_user_meta_data->>'referral_code'), '') <> '' THEN
      SELECT id INTO v_code_id FROM public.referral_codes
       WHERE upper(code) = upper(trim(NEW.raw_user_meta_data->>'referral_code')) AND is_active;
      IF v_code_id IS NOT NULL THEN
        INSERT INTO public.referrals (code_id, referred_user_id) VALUES (v_code_id, NEW.id)
        ON CONFLICT (referred_user_id) DO NOTHING;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RETURN NEW;
END;
$function$;