CREATE TABLE public.app_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  usd_pkr_rate NUMERIC(10,2) NOT NULL DEFAULT 280.00,
  account_title TEXT NOT NULL DEFAULT 'DollarCash Admin',
  account_number TEXT NOT NULL DEFAULT '03133221347',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton CHECK (id),
  CONSTRAINT app_settings_rate_positive CHECK (usd_pkr_rate > 0)
);

GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed in users can view settings" ON public.app_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON public.app_settings
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

GRANT INSERT, UPDATE ON public.app_settings TO authenticated;

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_settings (id) VALUES (true);

CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('EASYPAISA', 'JAZZCASH')),
  amount_usd NUMERIC(14,2) NOT NULL CHECK (amount_usd > 0),
  usd_pkr_rate NUMERIC(10,2) NOT NULL CHECK (usd_pkr_rate > 0),
  amount_pkr NUMERIC(14,2) NOT NULL CHECK (amount_pkr > 0),
  tid TEXT NOT NULL CHECK (length(btrim(tid)) BETWEEN 4 AND 64),
  screenshot_path TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX deposits_user_created_idx ON public.deposits (user_id, created_at DESC);
CREATE INDEX deposits_status_created_idx ON public.deposits (status, created_at DESC);

GRANT SELECT, INSERT ON public.deposits TO authenticated;
GRANT ALL ON public.deposits TO service_role;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deposits" ON public.deposits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all deposits" ON public.deposits
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can create own pending deposits" ON public.deposits
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'PENDING'
    AND rejection_reason IS NULL
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
  );

CREATE TRIGGER update_deposits_updated_at
  BEFORE UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Deposits are never allowed to be edited from the client; status changes go through review_deposit().
CREATE OR REPLACE FUNCTION public.deposits_guard_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT usd_pkr_rate INTO s FROM public.app_settings WHERE id;
    NEW.usd_pkr_rate := s.usd_pkr_rate;
    NEW.amount_pkr := round(NEW.amount_usd * s.usd_pkr_rate, 2);
    NEW.status := 'PENDING';
    NEW.rejection_reason := NULL;
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.created_at := now();
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF coalesce(current_setting('app.allow_deposit_review', true), 'off') <> 'on' THEN
    RAISE EXCEPTION 'Deposits can only be reviewed by an administrator';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER deposits_guard_fields_trg
  BEFORE INSERT OR UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.deposits_guard_fields();

CREATE OR REPLACE FUNCTION public.review_deposit(_deposit_id UUID, _approve BOOLEAN, _reason TEXT DEFAULT NULL)
RETURNS public.deposits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  d public.deposits;
BEGIN
  IF uid IS NULL OR NOT public.is_admin(uid) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO d FROM public.deposits WHERE id = _deposit_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit not found';
  END IF;
  IF d.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Deposit already reviewed';
  END IF;

  IF NOT _approve AND (_reason IS NULL OR btrim(_reason) = '') THEN
    RAISE EXCEPTION 'A rejection reason is required';
  END IF;

  PERFORM set_config('app.allow_deposit_review', 'on', true);
  UPDATE public.deposits
  SET status = CASE WHEN _approve THEN 'APPROVED' ELSE 'REJECTED' END,
      rejection_reason = CASE WHEN _approve THEN NULL ELSE btrim(_reason) END,
      reviewed_by = uid,
      reviewed_at = now()
  WHERE id = _deposit_id
  RETURNING * INTO d;
  PERFORM set_config('app.allow_deposit_review', 'off', true);

  IF _approve THEN
    PERFORM set_config('app.allow_balance_update', 'on', true);
    UPDATE public.profiles SET balance = balance + d.amount_usd WHERE id = d.user_id;
    PERFORM set_config('app.allow_balance_update', 'off', true);
  END IF;

  RETURN d;
END;
$$;

REVOKE ALL ON FUNCTION public.review_deposit(UUID, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_deposit(UUID, BOOLEAN, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_deposits(_status TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  phone TEXT,
  method TEXT,
  amount_usd NUMERIC,
  amount_pkr NUMERIC,
  usd_pkr_rate NUMERIC,
  tid TEXT,
  screenshot_path TEXT,
  status TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT d.id, d.user_id, p.full_name, p.phone, d.method, d.amount_usd, d.amount_pkr,
         d.usd_pkr_rate, d.tid, d.screenshot_path, d.status, d.rejection_reason,
         d.created_at, d.reviewed_at
  FROM public.deposits d
  JOIN public.profiles p ON p.id = d.user_id
  WHERE _status IS NULL OR d.status = _status
  ORDER BY d.created_at DESC
  LIMIT 200;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_deposits(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_deposits(TEXT) TO authenticated;