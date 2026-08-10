import type { SupabaseClient } from "@supabase/supabase-js";

type QuotaKind = "analysis" | "letter";

type ConsumeResult = {
  allowed: boolean;
  reason?: string;
  plan?: string;
  used?: number;
  limit?: number;
};

/**
 * Consumes one unit of the caller's monthly quota.
 * Throws a parseable QUOTA_EXCEEDED error when the plan limit is reached.
 * Returns the plan feature flags so callers can tailor the AI behaviour.
 */
export async function consumeQuota(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  kind: QuotaKind,
): Promise<{ plan: string; advancedAnalysis: boolean; exports: boolean }> {
  const { data, error } = await supabase.rpc("consume_quota", { _kind: kind });
  if (error) throw new Error(error.message);
  const result = (data ?? {}) as ConsumeResult;
  if (!result.allowed) {
    throw new Error(
      `QUOTA_EXCEEDED:${kind}:${result.used ?? 0}:${result.limit ?? 0}:${result.plan ?? "free"}`,
    );
  }
  const plan = result.plan ?? "free";
  const { data: planRow } = await supabase
    .from("plans")
    .select("advanced_analysis, exports")
    .eq("id", plan)
    .maybeSingle();
  return {
    plan,
    advancedAnalysis: !!planRow?.advanced_analysis,
    exports: !!planRow?.exports,
  };
}
