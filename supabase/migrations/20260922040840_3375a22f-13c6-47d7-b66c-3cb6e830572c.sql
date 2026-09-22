CREATE TABLE public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('EASYPAISA','JAZZCASH')),
  account_title TEXT NOT NULL CHECK (char_length(btrim(account_title)) BETWEEN 2 AND 80),
  account_number TEXT NOT NULL CHECK (char_length(btrim(account_number)) BETWEEN 6 AND 24),
  amount_usd NUMERIC(14,2) NOT NULL CHECK (amount_usd >= 0.15),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX withdrawals_user_created_idx ON public.withdrawals (user_id, created_at DESC);
CREATE INDEX withdrawals_status_idx ON public.withdrawals (status, created_at DESC);

GRANT SELECT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals"
  ON public.withdrawals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals"
  ON public.withdrawals FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_withdrawals_updated_at
  BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Member-facing: reserves the amount atomically at request time.
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  _method TEXT,
  _account_title TEXT,
  _account_number TEXT,
  _amount_usd NUMERIC
) RETURNS public.withdrawals
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  prof RECORD;
  w public.withdrawals;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _method IS NULL OR _method NOT IN ('EASYPAISA','JAZZCASH') THEN
    RAISE EXCEPTION 'Choose EasyPaisa or JazzCash';
  END IF;
  IF _amount_usd IS NULL OR round(_amount_usd, 2) < 0.15 THEN
    RAISE EXCEPTION 'Minimum withdrawal is $0.15';
  END IF;
  IF _account_title IS NULL OR char_length(btrim(_account_title)) < 2 THEN
    RAISE EXCEPTION 'Enter the account title';
  END IF;
  IF _account_number IS NULL OR char_length(btrim(_account_number)) < 6 THEN
    RAISE EXCEPTION 'Enter a valid account number';
  END IF;

  SELECT * INTO prof FROM public.profiles WHERE id = uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  IF prof.is_banned THEN
    RAISE EXCEPTION 'Account suspended';
  END IF;
  IF prof.balance < round(_amount_usd, 2) THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  PERFORM set_config('app.allow_balance_update', 'on', true);
  UPDATE public.profiles SET balance = balance - round(_amount_usd, 2) WHERE id = uid;
  PERFORM set_config('app.allow_balance_update', 'off', true);

  INSERT INTO public.withdrawals (user_id, method, account_title, account_number, amount_usd, status)
  VALUES (uid, _method, btrim(_account_title), btrim(_account_number), round(_amount_usd, 2), 'PENDING')
  RETURNING * INTO w;

  RETURN w;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_withdrawal(TEXT, TEXT, TEXT, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(TEXT, TEXT, TEXT, NUMERIC) TO authenticated;

-- Admin-facing list.
CREATE OR REPLACE FUNCTION public.admin_list_withdrawals(_status TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID, user_id UUID, full_name TEXT, phone TEXT, method TEXT,
  account_title TEXT, account_number TEXT, amount_usd NUMERIC,
  status TEXT, rejection_reason TEXT, created_at TIMESTAMPTZ, reviewed_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT w.id, w.user_id, p.full_name, p.phone, w.method, w.account_title, w.account_number,
         w.amount_usd, w.status, w.rejection_reason, w.created_at, w.reviewed_at
  FROM public.withdrawals w
  JOIN public.profiles p ON p.id = w.user_id
  WHERE _status IS NULL OR w.status = _status
  ORDER BY w.created_at DESC
  LIMIT 200;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_withdrawals(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_withdrawals(TEXT) TO authenticated;

-- Admin review: approve once, or reject once with a refund.
CREATE OR REPLACE FUNCTION public.review_withdrawal(
  _withdrawal_id UUID,
  _approve BOOLEAN,
  _reason TEXT DEFAULT NULL
) RETURNS public.withdrawals
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  w public.withdrawals;
BEGIN
  IF uid IS NULL OR NOT public.is_admin(uid) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO w FROM public.withdrawals WHERE id = _withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;
  IF w.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Withdrawal already reviewed';
  END IF;
  IF NOT _approve AND (_reason IS NULL OR btrim(_reason) = '') THEN
    RAISE EXCEPTION 'A rejection reason is required';
  END IF;

  UPDATE public.withdrawals
  SET status = CASE WHEN _approve THEN 'APPROVED' ELSE 'REJECTED' END,
      rejection_reason = CASE WHEN _approve THEN NULL ELSE btrim(_reason) END,
      reviewed_by = uid,
      reviewed_at = now()
  WHERE id = _withdrawal_id
  RETURNING * INTO w;

  IF NOT _approve THEN
    PERFORM set_config('app.allow_balance_update', 'on', true);
    UPDATE public.profiles SET balance = balance + w.amount_usd WHERE id = w.user_id;
    PERFORM set_config('app.allow_balance_update', 'off', true);
  END IF;

  RETURN w;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.review_withdrawal(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_withdrawal(UUID, BOOLEAN, TEXT) TO authenticated;