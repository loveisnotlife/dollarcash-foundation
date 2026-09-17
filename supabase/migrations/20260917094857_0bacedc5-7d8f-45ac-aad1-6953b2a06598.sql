REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_protect_fields() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, service_role;