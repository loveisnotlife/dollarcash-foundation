CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  reward numeric(14,2) NOT NULL DEFAULT 0.15,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in can view active tasks" ON public.tasks FOR SELECT TO authenticated USING (is_active OR public.is_admin(auth.uid()));

CREATE TABLE public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  task_date date NOT NULL,
  reward numeric(14,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_id, task_date)
);
GRANT SELECT ON public.task_completions TO authenticated;
GRANT ALL ON public.task_completions TO service_role;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own task completions" ON public.task_completions FOR SELECT TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.tasks (title, description, reward, sort_order) VALUES
 ('Daily check-in', 'Check in today to collect your daily task reward.', 0.15, 1);

CREATE OR REPLACE FUNCTION public.complete_task(_task_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _t public.tasks;
  _today date := (now() AT TIME ZONE 'Asia/Karachi')::date;
  _banned boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT is_banned INTO _banned FROM profiles WHERE id = _uid FOR UPDATE;
  IF _banned IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF _banned THEN RAISE EXCEPTION 'Account is blocked'; END IF;
  IF NOT EXISTS (SELECT 1 FROM user_investments WHERE user_id = _uid AND status = 'ACTIVE' AND expires_at > now()) THEN
    RAISE EXCEPTION 'Tasks are available only for members with an active plan';
  END IF;
  SELECT * INTO _t FROM tasks WHERE id = _task_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Task not available'; END IF;
  BEGIN
    INSERT INTO task_completions (user_id, task_id, task_date, reward) VALUES (_uid, _t.id, _today, _t.reward);
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'Task already completed today';
  END;
  PERFORM set_config('app.allow_balance_update','on',true);
  UPDATE profiles SET balance = balance + _t.reward WHERE id = _uid;
  PERFORM set_config('app.allow_balance_update','off',true);
  RETURN jsonb_build_object('reward', _t.reward, 'date', _today);
END $$;
REVOKE ALL ON FUNCTION public.complete_task(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_task(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.my_tasks_today()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'eligible', EXISTS (SELECT 1 FROM user_investments WHERE user_id = auth.uid() AND status='ACTIVE' AND expires_at > now()),
    'tasks', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',t.id,'title',t.title,'description',t.description,'reward',t.reward,
        'done', EXISTS (SELECT 1 FROM task_completions c WHERE c.user_id=auth.uid() AND c.task_id=t.id AND c.task_date=(now() AT TIME ZONE 'Asia/Karachi')::date))
        ORDER BY t.sort_order) FROM tasks t WHERE t.is_active), '[]'::jsonb)
  )
$$;
REVOKE ALL ON FUNCTION public.my_tasks_today() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_tasks_today() TO authenticated;