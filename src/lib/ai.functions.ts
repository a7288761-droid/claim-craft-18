import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAnalysis, runImageOcr, runLetter } from "./ai/analysis.server";
import { consumeQuota } from "./quota.server";

export const analyzeDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      categoryName: string;
      fileNames: string[];
      notes?: string;
      extractedText: string;
      language?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const plan = await consumeQuota(context.supabase, "analysis");
    return runAnalysis({ ...data, advanced: plan.advancedAnalysis });
  });

export const draftAppealLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      categoryName: string;
      extractedText?: string;
      analysisJson: string;
      recipient?: string;
      senderName?: string;
      language?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await consumeQuota(context.supabase, "letter");
    return { body: await runLetter(data) };
  });

export const ocrImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fileName: string; dataUrl: string }) => input)
  .handler(async ({ data }) => ({ text: await runImageOcr(data) }));