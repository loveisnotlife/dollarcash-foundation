CREATE OR REPLACE FUNCTION public.profiles_protect_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin BOOLEAN := false;
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
    NEW.balance := OLD.balance;
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
$$;

UPDATE public.profiles SET role = 'admin' WHERE phone = '+923133221347';