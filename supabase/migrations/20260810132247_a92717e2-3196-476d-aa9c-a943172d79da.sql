REVOKE EXECUTE ON FUNCTION public.subscription_summary() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.consume_quota(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.subscription_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_quota(text) TO authenticated;