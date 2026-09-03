CREATE TABLE public.plans (
  id text PRIMARY KEY,
  sort_order int NOT NULL DEFAULT 0,
  monthly_analyses int NOT NULL DEFAULT 0,
  monthly_letters int NOT NULL DEFAULT 0,
  advanced_analysis boolean NOT NULL DEFAULT false,
  exports boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT ON public.plans TO anon;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans readable" ON public.plans FOR SELECT TO authenticated, anon USING (true);

INSERT INTO public.plans (id, sort_order, monthly_analyses, monthly_letters, advanced_analysis, exports) VALUES
  ('free', 1, 3, 2, false, false),
  ('basic', 2, 15, 10, true, true),
  ('pro', 3, 60, 40, true, true);

CREATE TABLE public.subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'active',
  current_period_start date NOT NULL DEFAULT date_trunc('month', now())::date,
  provider text,
  provider_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subscription read" ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL DEFAULT date_trunc('month', now())::date,
  analyses_used int NOT NULL DEFAULT 0,
  letters_used int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start)
);
GRANT SELECT ON public.usage_counters TO authenticated;
GRANT ALL ON public.usage_counters TO service_role;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own usage read" ON public.usage_counters FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE TRIGGER usage_counters_updated_at BEFORE UPDATE ON public.usage_counters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.subscription_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  period date := date_trunc('month', now())::date;
  plan_id text;
  p public.plans%ROWTYPE;
  u public.usage_counters%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthenticated');
  END IF;

  SELECT plan INTO plan_id FROM public.subscriptions WHERE user_id = uid;
  IF plan_id IS NULL THEN plan_id := 'free'; END IF;
  SELECT * INTO p FROM public.plans WHERE id = plan_id;
  SELECT * INTO u FROM public.usage_counters WHERE user_id = uid AND period_start = period;

  RETURN jsonb_build_object(
    'plan', plan_id,
    'periodStart', period,
    'periodEnd', (period + interval '1 month')::date,
    'limits', jsonb_build_object(
      'analyses', p.monthly_analyses,
      'letters', p.monthly_letters,
      'advancedAnalysis', p.advanced_analysis,
      'exports', p.exports
    ),
    'used', jsonb_build_object(
      'analyses', COALESCE(u.analyses_used, 0),
      'letters', COALESCE(u.letters_used, 0)
    )
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.subscription_summary() TO authenticated;

CREATE OR REPLACE FUNCTION public.consume_quota(_kind text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  period date := date_trunc('month', now())::date;
  plan_id text;
  max_allowed int;
  current_used int;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  END IF;
  IF _kind NOT IN ('analysis', 'letter') THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'invalid_kind');
  END IF;

  SELECT plan INTO plan_id FROM public.subscriptions WHERE user_id = uid;
  IF plan_id IS NULL THEN
    INSERT INTO public.subscriptions (user_id, plan) VALUES (uid, 'free')
      ON CONFLICT (user_id) DO NOTHING;
    plan_id := 'free';
  END IF;

  SELECT CASE WHEN _kind = 'analysis' THEN monthly_analyses ELSE monthly_letters END
    INTO max_allowed FROM public.plans WHERE id = plan_id;

  INSERT INTO public.usage_counters (user_id, period_start) VALUES (uid, period)
    ON CONFLICT (user_id, period_start) DO NOTHING;

  SELECT CASE WHEN _kind = 'analysis' THEN analyses_used ELSE letters_used END
    INTO current_used FROM public.usage_counters
    WHERE user_id = uid AND period_start = period FOR UPDATE;

  IF current_used >= max_allowed THEN
    RETURN jsonb_build_object(
      'allowed', false, 'reason', 'limit_reached', 'plan', plan_id,
      'used', current_used, 'limit', max_allowed
    );
  END IF;

  UPDATE public.usage_counters
    SET analyses_used = analyses_used + CASE WHEN _kind = 'analysis' THEN 1 ELSE 0 END,
        letters_used = letters_used + CASE WHEN _kind = 'letter' THEN 1 ELSE 0 END
    WHERE user_id = uid AND period_start = period;

  RETURN jsonb_build_object(
    'allowed', true, 'plan', plan_id,
    'used', current_used + 1, 'limit', max_allowed
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.consume_quota(text) TO authenticated;