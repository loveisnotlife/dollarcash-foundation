CREATE OR REPLACE FUNCTION public.withdrawal_gate_for(_uid uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object('required_referrals', 0, 'paid_referrals', public.successful_referral_count(_uid), 'allowed', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.request_withdrawal(_method text, _account_title text, _account_number text, _amount_usd numeric)
 RETURNS withdrawals LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  uid UUID := auth.uid();
  prof RECORD;
  w public.withdrawals;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _method IS NULL OR _method NOT IN ('EASYPAISA','JAZZCASH') THEN RAISE EXCEPTION 'Choose EasyPaisa or JazzCash'; END IF;
  IF _amount_usd IS NULL OR round(_amount_usd, 2) < 0.50 THEN RAISE EXCEPTION 'Minimum withdrawal is $0.50'; END IF;
  IF _account_title IS NULL OR char_length(btrim(_account_title)) < 2 THEN RAISE EXCEPTION 'Enter the account title'; END IF;
  IF _account_number IS NULL OR char_length(btrim(_account_number)) < 6 THEN RAISE EXCEPTION 'Enter a valid account number'; END IF;

  SELECT * INTO prof FROM public.profiles WHERE id = uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF prof.is_banned THEN RAISE EXCEPTION 'Account suspended'; END IF;
  IF prof.balance < round(_amount_usd, 2) THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  PERFORM set_config('app.allow_balance_update', 'on', true);
  UPDATE public.profiles SET balance = balance - round(_amount_usd, 2) WHERE id = uid;
  PERFORM set_config('app.allow_balance_update', 'off', true);

  INSERT INTO public.withdrawals (user_id, method, account_title, account_number, amount_usd, status)
  VALUES (uid, _method, btrim(_account_title), btrim(_account_number), round(_amount_usd, 2), 'PENDING')
  RETURNING * INTO w;
  RETURN w;
END;
$function$;