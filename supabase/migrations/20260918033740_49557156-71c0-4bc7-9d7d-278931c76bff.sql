CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.investment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cost NUMERIC(14,2) NOT NULL,
  daily_return NUMERIC(14,2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 15,
  total_return NUMERIC(14,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.investment_plans TO authenticated;
GRANT ALL ON public.investment_plans TO service_role;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can view active plans"
ON public.investment_plans FOR SELECT TO authenticated
USING (is_active);

CREATE POLICY "Admins can manage plans"
ON public.investment_plans FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_investment_plans_updated_at
BEFORE UPDATE ON public.investment_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.investment_plans(id),
  plan_name TEXT NOT NULL,
  amount_invested NUMERIC(14,2) NOT NULL,
  daily_return NUMERIC(14,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX user_investments_user_idx ON public.user_investments (user_id, activated_at DESC);

GRANT SELECT ON public.user_investments TO authenticated;
GRANT ALL ON public.user_investments TO service_role;
ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investments"
ON public.user_investments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all investments"
ON public.user_investments FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_user_investments_updated_at
BEFORE UPDATE ON public.user_investments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.investment_plans (name, cost, daily_return, duration_days, total_return, sort_order) VALUES
  ('Plan 1', 1.00, 0.15, 15, 2.25, 1),
  ('Plan 2', 2.00, 0.25, 15, 3.75, 2),
  ('Plan 3', 5.00, 0.50, 15, 7.50, 3),
  ('Plan 4', 10.00, 1.00, 15, 15.00, 4);

-- Allow the trusted purchase routine to adjust balance despite the profile field guard
CREATE OR REPLACE FUNCTION public.profiles_protect_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  caller_is_admin BOOLEAN := false;
  balance_ok BOOLEAN := coalesce(current_setting('app.allow_balance_update', true) = 'on', false);
  owner_phone TEXT := '+923133221347';
BEGIN
  IF auth.uid() IS NOT NULL THEN
    caller_is_admin := public.is_admin(auth.uid());
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
      NEW.referral_code := public.generate_referral_code();
    END IF;
    IF NOT caller_is_admin THEN
      NEW.role := 'user';
      NEW.balance := 0;
      NEW.is_banned := false;
    END IF;
    IF NEW.phone = owner_phone THEN
      NEW.role := 'admin';
    END IF;
    NEW.created_at := now();
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF NOT caller_is_admin THEN
    NEW.role := OLD.role;
    IF NOT balance_ok THEN
      NEW.balance := OLD.balance;
    END IF;
    NEW.is_banned := OLD.is_banned;
    NEW.referral_code := OLD.referral_code;
    NEW.referred_by := OLD.referred_by;
    NEW.phone := OLD.phone;
    NEW.id := OLD.id;
  END IF;
  NEW.created_at := OLD.created_at;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.purchase_investment_plan(_plan_id UUID)
RETURNS public.user_investments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  p RECORD;
  prof RECORD;
  inv public.user_investments;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO p FROM public.investment_plans WHERE id = _plan_id AND is_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;

  SELECT * INTO prof FROM public.profiles WHERE id = uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  IF prof.is_banned THEN
    RAISE EXCEPTION 'Account suspended';
  END IF;
  IF prof.balance < p.cost THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  PERFORM set_config('app.allow_balance_update', 'on', true);
  UPDATE public.profiles SET balance = balance - p.cost WHERE id = uid;
  PERFORM set_config('app.allow_balance_update', 'off', true);

  INSERT INTO public.user_investments (
    user_id, plan_id, plan_name, amount_invested, daily_return, duration_days, activated_at, expires_at, status
  ) VALUES (
    uid, p.id, p.name, p.cost, p.daily_return, p.duration_days, now(), now() + (p.duration_days || ' days')::interval, 'ACTIVE'
  ) RETURNING * INTO inv;

  RETURN inv;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_investment_plan(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_investment_plan(UUID) TO authenticated;