import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PlanId = "free" | "basic" | "pro";

export const PLAN_IDS: PlanId[] = ["free", "basic", "pro"];

export type PlanLimits = {
  analyses: number;
  letters: number;
  advancedAnalysis: boolean;
  exports: boolean;
};

export type SubscriptionSummary = {
  plan: PlanId;
  periodStart: string;
  periodEnd: string;
  limits: PlanLimits;
  used: { analyses: number; letters: number };
};

const FALLBACK: SubscriptionSummary = {
  plan: "free",
  periodStart: "",
  periodEnd: "",
  limits: { analyses: 3, letters: 2, advancedAnalysis: false, exports: false },
  used: { analyses: 0, letters: 0 },
};

export async function fetchSubscription(): Promise<SubscriptionSummary> {
  const { data, error } = await supabase.rpc("subscription_summary");
  if (error || !data || typeof data !== "object") return FALLBACK;
  return data as unknown as SubscriptionSummary;
}

export const subscriptionQueryKey = ["subscription", "summary"] as const;

export function useSubscription() {
  return useQuery({ queryKey: subscriptionQueryKey, queryFn: fetchSubscription });
}

export function remaining(summary: SubscriptionSummary | undefined, kind: "analyses" | "letters") {
  if (!summary) return null;
  return Math.max(0, summary.limits[kind] - summary.used[kind]);
}

/** Marker thrown by server functions when a plan limit is reached. */
export const QUOTA_PREFIX = "QUOTA_EXCEEDED";

export type QuotaError = { kind: "analysis" | "letter"; used: number; limit: number; plan: string };

export function parseQuotaError(error: unknown): QuotaError | null {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const match = message.match(/QUOTA_EXCEEDED:(analysis|letter):(\d+):(\d+):([a-z]+)/);
  if (!match) return null;
  return {
    kind: match[1] as QuotaError["kind"],
    used: Number(match[2]),
    limit: Number(match[3]),
    plan: match[4]!,
  };
}
