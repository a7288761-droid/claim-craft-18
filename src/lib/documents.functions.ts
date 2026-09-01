import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runDocumentFacts, runDocumentQa, type DocumentFact } from "./ai/documents.server";

export type ClaimDocumentFacts = {
  documentId: string;
  fileName: string;
  facts: DocumentFact[];
};

/**
 * Extracts the comparable fact sheet for every document of a claim.
 * Results are cached on `documents.facts`; pass `force` to re-run.
 */
export const extractClaimFacts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { claimId: string; force?: boolean }) => input)
  .handler(async ({ data, context }): Promise<ClaimDocumentFacts[]> => {
    const { data: documents, error } = await context.supabase
      .from("documents")
      .select("id, file_name, extracted_text, facts")
      .eq("claim_id", data.claimId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const rows = documents ?? [];
    const results: ClaimDocumentFacts[] = [];

    for (const row of rows) {
      const cached = Array.isArray(row.facts) ? (row.facts as unknown as DocumentFact[]) : [];
      if (!data.force && cached.length > 0) {
        results.push({ documentId: row.id, fileName: row.file_name, facts: cached });
        continue;
      }
      const facts = await runDocumentFacts({
        fileName: row.file_name,
        text: row.extracted_text ?? "",
      });
      await context.supabase
        .from("documents")
        .update({ facts: facts as unknown as never })
        .eq("id", row.id);
      results.push({ documentId: row.id, fileName: row.file_name, facts });
    }

    return results;
  });

/** Answers a question using only the documents attached to the given claim. */
export const askMyDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      claimId: string;
      question: string;
      language?: string;
      notFoundMessage: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { data: documents, error } = await context.supabase
      .from("documents")
      .select("file_name, extracted_text")
      .eq("claim_id", data.claimId);
    if (error) throw new Error(error.message);

    const result = await runDocumentQa({
      question: data.question,
      language: data.language ?? "",
      notFoundMessage: data.notFoundMessage,
      documents: (documents ?? []).map((row) => ({
        fileName: row.file_name,
        text: row.extracted_text ?? "",
      })),
    });

    const { data: saved } = await context.supabase
      .from("document_questions")
      .insert({
        user_id: context.userId,
        claim_id: data.claimId,
        question: data.question,
        answer: result.answer,
        sources: result.sources as unknown as never,
      })
      .select("id, created_at")
      .single();

    return { ...result, id: saved?.id ?? "", createdAt: saved?.created_at ?? "" };
  });
