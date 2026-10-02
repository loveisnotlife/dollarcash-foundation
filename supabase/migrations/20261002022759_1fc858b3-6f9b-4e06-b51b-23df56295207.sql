CREATE OR REPLACE FUNCTION public.withdrawal_gate_for(_uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  approved int; pending int; next_n int; required int; have int;
BEGIN
  SELECT count(*) FILTER (WHERE status='APPROVED'), count(*) FILTER (WHERE status='PENDING')
    INTO approved, pending FROM public.withdrawals WHERE user_id=_uid;
  next_n := approved + pending + 1;
  required := CASE WHEN next_n >= 3 THEN 1 ELSE 0 END;
  have := public.successful_referral_count(_uid);
  RETURN jsonb_build_object('approved', approved, 'pending', pending, 'next_number', next_n,
    'required_referrals', required, 'paid_referrals', have, 'allowed', have >= required);
END;
$function$;

ALTER TABLE public.app_settings
  ADD COLUMN account_title_2 text NOT NULL DEFAULT 'Quratulain',
  ADD COLUMN account_number_2 text NOT NULL DEFAULT '03151390564';