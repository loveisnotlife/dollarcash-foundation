CREATE OR REPLACE FUNCTION public.credit_daily_profits()
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE expired_count INT := 0;
BEGIN
  -- Daily returns are now paid only when the member completes the daily check-in.
  UPDATE public.user_investments SET status = 'EXPIRED'
  WHERE status = 'ACTIVE' AND expires_at <= now();
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN jsonb_build_object('investments_expired', expired_count);
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_task(_task_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _t public.tasks;
  _today date := (now() AT TIME ZONE 'Asia/Karachi')::date;
  _banned boolean;
  inv RECORD;
  inserted uuid;
  _total numeric(14,2) := 0;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT is_banned INTO _banned FROM profiles WHERE id = _uid FOR UPDATE;
  IF _banned IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF _banned THEN RAISE EXCEPTION 'Account is blocked'; END IF;
  UPDATE user_investments SET status='EXPIRED' WHERE user_id=_uid AND status='ACTIVE' AND expires_at <= now();
  IF NOT EXISTS (SELECT 1 FROM user_investments WHERE user_id = _uid AND status = 'ACTIVE' AND expires_at > now()) THEN
    RAISE EXCEPTION 'Tasks are available only for members with an active plan';
  END IF;
  SELECT * INTO _t FROM tasks WHERE id = _task_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Task not available'; END IF;
  IF EXISTS (SELECT 1 FROM task_completions WHERE user_id=_uid AND task_id=_t.id AND task_date=_today) THEN
    RAISE EXCEPTION 'Task already completed today';
  END IF;

  FOR inv IN SELECT id, plan_name, daily_return FROM user_investments
    WHERE user_id=_uid AND status='ACTIVE' AND expires_at > now() AND activated_at <= now() ORDER BY id
  LOOP
    inserted := NULL;
    INSERT INTO profit_payments (user_id, investment_id, plan_name, amount, profit_date)
    VALUES (_uid, inv.id, inv.plan_name, inv.daily_return, _today)
    ON CONFLICT (investment_id, profit_date) DO NOTHING RETURNING id INTO inserted;
    IF inserted IS NOT NULL THEN _total := _total + inv.daily_return; END IF;
  END LOOP;

  BEGIN
    INSERT INTO task_completions (user_id, task_id, task_date, reward) VALUES (_uid, _t.id, _today, _total);
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'Task already completed today';
  END;
  IF _total > 0 THEN
    PERFORM set_config('app.allow_balance_update','on',true);
    UPDATE profiles SET balance = balance + _total WHERE id = _uid;
    PERFORM set_config('app.allow_balance_update','off',true);
  END IF;
  RETURN jsonb_build_object('reward', _total, 'date', _today);
END $function$;

CREATE OR REPLACE FUNCTION public.my_tasks_today()
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'eligible', EXISTS (SELECT 1 FROM user_investments WHERE user_id = auth.uid() AND status='ACTIVE' AND expires_at > now()),
    'tasks', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',t.id,'title',t.title,'description',t.description,
        'reward', COALESCE((SELECT sum(daily_return) FROM user_investments WHERE user_id=auth.uid() AND status='ACTIVE' AND expires_at > now()),0),
        'done', EXISTS (SELECT 1 FROM task_completions c WHERE c.user_id=auth.uid() AND c.task_id=t.id AND c.task_date=(now() AT TIME ZONE 'Asia/Karachi')::date))
        ORDER BY t.sort_order) FROM tasks t WHERE t.is_active), '[]'::jsonb)
  )
$function$;