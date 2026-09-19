CREATE TABLE public.profit_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES public.user_investments(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  profit_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT profit_payments_unique_per_day UNIQUE (investment_id, profit_date)
);

CREATE INDEX profit_payments_user_date_idx ON public.profit_payments (user_id, profit_date DESC);

GRANT SELECT ON public.profit_payments TO authenticated;
GRANT ALL ON public.profit_payments TO service_role;

ALTER TABLE public.profit_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profit payments"
ON public.profit_payments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profit payments"
ON public.profit_payments FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.credit_daily_profits()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today DATE := (now() AT TIME ZONE 'Asia/Karachi')::date;
  inv RECORD;
  paid_count INT := 0;
  paid_total NUMERIC(14,2) := 0;
  expired_count INT := 0;
  inserted UUID;
BEGIN
  FOR inv IN
    SELECT ui.id, ui.user_id, ui.plan_name, ui.daily_return
    FROM public.user_investments ui
    JOIN public.profiles p ON p.id = ui.user_id
    WHERE ui.status = 'ACTIVE'
      AND ui.expires_at > now()
      AND ui.activated_at <= now()
      AND p.is_banned = false
    ORDER BY ui.id
  LOOP
    INSERT INTO public.profit_payments (user_id, investment_id, plan_name, amount, profit_date)
    VALUES (inv.user_id, inv.id, inv.plan_name, inv.daily_return, today)
    ON CONFLICT (investment_id, profit_date) DO NOTHING
    RETURNING id INTO inserted;

    IF inserted IS NOT NULL THEN
      PERFORM set_config('app.allow_balance_update', 'on', true);
      UPDATE public.profiles
      SET balance = balance + inv.daily_return
      WHERE id = inv.user_id;
      PERFORM set_config('app.allow_balance_update', 'off', true);

      paid_count := paid_count + 1;
      paid_total := paid_total + inv.daily_return;
    END IF;
    inserted := NULL;
  END LOOP;

  UPDATE public.user_investments
  SET status = 'EXPIRED'
  WHERE status = 'ACTIVE' AND expires_at <= now();
  GET DIAGNOSTICS expired_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'profit_date', today,
    'payments_created', paid_count,
    'amount_credited', paid_total,
    'investments_expired', expired_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.credit_daily_profits() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credit_daily_profits() FROM anon;
REVOKE ALL ON FUNCTION public.credit_daily_profits() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.credit_daily_profits() TO service_role;