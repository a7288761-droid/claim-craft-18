import { supabase } from "@/integrations/supabase/client";
import { daysUntil } from "@/lib/claim-status";

export type NotificationType = "info" | "success" | "warning";

export type NotificationInput = {
  userId: string;
  claimId?: string | null;
  title: string;
  message: string;
  type?: NotificationType;
};

function toRow(input: NotificationInput) {
  return {
    user_id: input.userId,
    claim_id: input.claimId ?? null,
    title: input.title,
    message: input.message,
    type: input.type ?? "info",
  };
}

export async function notify(input: NotificationInput) {
  const { error } = await supabase.from("notifications").insert(toRow(input));
  if (error) console.error("notification insert failed", error);
}

export async function notifyMany(inputs: NotificationInput[]) {
  if (inputs.length === 0) return;
  const { error } = await supabase.from("notifications").insert(inputs.map(toRow));
  if (error) console.error("notification insert failed", error);
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

/**
 * Creates deadline reminders for claims whose appeal deadline is within
 * `withinDays`, once per claim. Uses only real stored deadlines.
 */
export async function runDeadlineReminders(t: Translate, withinDays = 7) {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const { data, error } = await supabase
    .from("claims")
    .select("id, category, deadline_at, deadline_notified_at, status")
    .not("deadline_at", "is", null)
    .is("deadline_notified_at", null);
  if (error || !data) return;

  const due = data.filter((claim) => {
    if (claim.status === "closed") return false;
    const left = daysUntil(claim.deadline_at);
    return left !== null && left <= withinDays;
  });
  if (due.length === 0) return;

  await notifyMany(
    due.map((claim) => {
      const left = daysUntil(claim.deadline_at) ?? 0;
      return {
        userId,
        claimId: claim.id,
        type: "warning" as const,
        title: t("notify.deadlineSoonTitle"),
        message:
          left < 0
            ? t("notify.deadlinePassed", { date: claim.deadline_at })
            : t("notify.deadlineSoon", { days: left, date: claim.deadline_at }),
      };
    }),
  );

  await supabase
    .from("claims")
    .update({ deadline_notified_at: new Date().toISOString() })
    .in(
      "id",
      due.map((claim) => claim.id),
    );
}
