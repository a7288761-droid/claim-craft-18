export const CLAIM_STATUSES = [
  "draft",
  "analysing",
  "needs_info",
  "ready_to_appeal",
  "appeal_drafted",
  "submitted",
  "awaiting_response",
  "closed",
] as const;

export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

const LEGACY: Record<string, ClaimStatus> = {
  analysed: "ready_to_appeal",
  analyzed: "ready_to_appeal",
  failed: "draft",
  new: "draft",
};

export function normalizeStatus(value?: string | null): ClaimStatus {
  if (!value) return "draft";
  if ((CLAIM_STATUSES as readonly string[]).includes(value)) return value as ClaimStatus;
  return LEGACY[value] ?? "draft";
}

/** Semantic-token badge styles per status. */
export const STATUS_TONE: Record<ClaimStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  analysing: "bg-primary-soft text-primary",
  needs_info: "bg-destructive/10 text-destructive",
  ready_to_appeal: "bg-primary-soft text-primary",
  appeal_drafted: "bg-primary-soft text-primary",
  submitted: "bg-muted text-foreground",
  awaiting_response: "bg-muted text-foreground",
  closed: "bg-muted text-muted-foreground",
};

/** Workspace buckets used by the dashboard counters. */
export const STATUS_BUCKETS = {
  needsAction: ["draft", "needs_info"] as ClaimStatus[],
  waiting: ["analysing", "submitted", "awaiting_response"] as ClaimStatus[],
  readyToAppeal: ["ready_to_appeal", "appeal_drafted"] as ClaimStatus[],
  closed: ["closed"] as ClaimStatus[],
};

export function statusLabelKey(status: ClaimStatus) {
  return `claimStatus.${status}`;
}

/** Whole days between today and an ISO date, or null when not computable. */
export function daysUntil(date?: string | null): number | null {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}
