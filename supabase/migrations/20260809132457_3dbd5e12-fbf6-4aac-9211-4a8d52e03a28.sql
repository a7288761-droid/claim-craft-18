ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS deadline_at date,
  ADD COLUMN IF NOT EXISTS deadline_note text,
  ADD COLUMN IF NOT EXISTS deadline_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.analysis_results
  ADD COLUMN IF NOT EXISTS strength_level text,
  ADD COLUMN IF NOT EXISTS strength_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS strength_improvements jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deadline_date date,
  ADD COLUMN IF NOT EXISTS deadline_note text;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS claim_id uuid REFERENCES public.claims(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.set_status_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS claims_status_updated_at ON public.claims;
CREATE TRIGGER claims_status_updated_at
BEFORE UPDATE ON public.claims
FOR EACH ROW EXECUTE FUNCTION public.set_status_updated_at();

CREATE INDEX IF NOT EXISTS notifications_claim_id_idx ON public.notifications(claim_id);
CREATE INDEX IF NOT EXISTS claims_status_idx ON public.claims(status);