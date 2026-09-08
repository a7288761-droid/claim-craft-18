REVOKE TRUNCATE, MAINTAIN, REFERENCES, TRIGGER ON public.subscriptions FROM authenticated;
REVOKE ALL ON public.subscriptions FROM anon;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;