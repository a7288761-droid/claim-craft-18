ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS facts jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.analysis_results ADD COLUMN IF NOT EXISTS contradictions jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.document_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_id uuid NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_questions TO authenticated;
GRANT ALL ON public.document_questions TO service_role;

ALTER TABLE public.document_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own document questions" ON public.document_questions;
CREATE POLICY "own document questions" ON public.document_questions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS document_questions_claim_idx
  ON public.document_questions (claim_id, created_at DESC);