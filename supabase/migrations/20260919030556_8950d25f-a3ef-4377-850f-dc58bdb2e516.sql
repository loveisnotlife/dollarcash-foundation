CREATE TABLE public.referral_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone INTEGER NOT NULL,
  reward_amount NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (referrer_id, milestone)
);

GRANT SELECT ON public.referral_rewards TO authenticated;
GRANT ALL ON public.referral_rewards TO service_role;

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral rewards"
ON public.referral_rewards FOR SELECT TO authenticated
USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referral rewards"
ON public.referral_rewards FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE INDEX idx_referral_rewards_referrer ON public.referral_rewards (referrer_id);

-- Count of referred members who registered AND activated an investment plan
CREATE OR REPLACE FUNCTION public.successful_referral_count(_referrer_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM public.profiles p
  WHERE p.referred_by IS NOT NULL
    AND upper(p.referred_by) = (SELECT upper(referral_code) FROM public.profiles WHERE id = _referrer_id)
    AND EXISTS (SELECT 1 FROM public.user_investments ui WHERE ui.user_id = p.id)
$$;

REVOKE ALL ON FUNCTION public.successful_referral_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.successful_referral_count(UUID) TO authenticated, service_role;

-- Award any newly reached milestones, once each, crediting the referrer's balance
CREATE OR REPLACE FUNCTION public.award_referral_milestones(_referrer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt INTEGER;
  m RECORD;
  inserted UUID;
BEGIN
  IF _referrer_id IS NULL THEN
    RETURN;
  END IF;

  SELECT public.successful_referral_count(_referrer_id) INTO cnt;

  FOR m IN
    SELECT * FROM (VALUES (5, 1.00), (10, 2.00), (25, 5.00), (50, 10.00)) AS t(milestone, reward)
    ORDER BY milestone
  LOOP
    IF cnt >= m.milestone THEN
      INSERT INTO public.referral_rewards (referrer_id, milestone, reward_amount)
      VALUES (_referrer_id, m.milestone, m.reward)
      ON CONFLICT (referrer_id, milestone) DO NOTHING
      RETURNING id INTO inserted;

      IF inserted IS NOT NULL THEN
        PERFORM set_config('app.allow_balance_update', 'on', true);
        UPDATE public.profiles SET balance = balance + m.reward WHERE id = _referrer_id;
        PERFORM set_config('app.allow_balance_update', 'off', true);
      END IF;
      inserted := NULL;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.award_referral_milestones(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_referral_milestones(UUID) TO service_role;

-- Fires when a member activates an investment plan: credit their referrer's milestones
CREATE OR REPLACE FUNCTION public.referral_on_investment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_code TEXT;
  referrer UUID;
BEGIN
  SELECT upper(referred_by) INTO ref_code FROM public.profiles WHERE id = NEW.user_id;
  IF ref_code IS NULL OR ref_code = '' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO referrer FROM public.profiles WHERE upper(referral_code) = ref_code LIMIT 1;
  IF referrer IS NULL OR referrer = NEW.user_id THEN
    RETURN NEW;
  END IF;

  PERFORM public.award_referral_milestones(referrer);
  RETURN NEW;
END;
$$;

CREATE TRIGGER referral_on_investment_trg
AFTER INSERT ON public.user_investments
FOR EACH ROW EXECUTE FUNCTION public.referral_on_investment();

-- Stats for the signed-in member's dashboard
CREATE OR REPLACE FUNCTION public.my_referral_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  my_code TEXT;
  total_invites INTEGER := 0;
  successful INTEGER := 0;
  rewards NUMERIC(14,2) := 0;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT upper(referral_code) INTO my_code FROM public.profiles WHERE id = uid;

  SELECT count(*)::int INTO total_invites
  FROM public.profiles WHERE upper(referred_by) = my_code;

  successful := public.successful_referral_count(uid);

  SELECT coalesce(sum(reward_amount), 0) INTO rewards
  FROM public.referral_rewards WHERE referrer_id = uid;

  RETURN jsonb_build_object(
    'referral_code', my_code,
    'total_invites', total_invites,
    'successful_invites', successful,
    'rewards_earned', rewards
  );
END;
$$;

REVOKE ALL ON FUNCTION public.my_referral_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_referral_stats() TO authenticated, service_role;