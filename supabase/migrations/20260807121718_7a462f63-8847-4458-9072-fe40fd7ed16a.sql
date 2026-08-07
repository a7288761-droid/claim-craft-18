ALTER TABLE public.analysis_results ADD COLUMN IF NOT EXISTS missing_information jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS extracted_text text;