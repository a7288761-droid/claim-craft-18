import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { extractClaimFacts } from "@/lib/documents.functions";
import type { ClaimDocumentFacts } from "@/lib/document-facts";

export function claimFactsQueryKey(claimId: string) {
  return ["claim-facts", claimId] as const;
}

/**
 * Loads (and extracts on first use) the comparable fact sheet of every document
 * attached to the claim. RLS scopes the read to the signed-in owner.
 */
export function useClaimFacts(claimId: string, enabled = true) {
  const run = useServerFn(extractClaimFacts);
  return useQuery({
    queryKey: claimFactsQueryKey(claimId),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<ClaimDocumentFacts[]> =>
      (await run({ data: { claimId } })) as ClaimDocumentFacts[],
  });
}
