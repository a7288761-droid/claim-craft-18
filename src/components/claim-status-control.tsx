import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLAIM_STATUSES, normalizeStatus, type ClaimStatus } from "@/lib/claim-status";
import { notify } from "@/lib/claim-notifications";
import { useI18n } from "@/i18n/language-provider";
import { ClaimStatusBadge } from "@/components/claim-status-badge";

export function ClaimStatusControl({
  claimId,
  status,
  statusUpdatedAt,
}: {
  claimId: string;
  status: string;
  statusUpdatedAt?: string | null;
}) {
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const current = normalizeStatus(status);

  const update = useMutation({
    mutationFn: async (next: ClaimStatus) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("claims").update({ status: next }).eq("id", claimId);
      if (error) throw error;
      if (auth.user) {
        await notify({
          userId: auth.user.id,
          claimId,
          type: "info",
          title: t("notify.statusChangedTitle"),
          message: t("notify.statusChanged", { status: t(`claimStatus.${next}`) }),
        });
      }
    },
    onSuccess: () => {
      toast.success(t("claimStatus.updated"));
      queryClient.invalidateQueries({ queryKey: ["analysis", claimId] });
      queryClient.invalidateQueries({ queryKey: ["claims-history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => toast.error(t("claimStatus.updateFailed")),
  });

  return (
    <section className="surface-card animate-rise flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("claimStatus.label")}
        </p>
        <ClaimStatusBadge status={current} />
        {statusUpdatedAt ? (
          <p className="text-xs text-muted-foreground">
            {t("claimStatus.lastUpdated", {
              date: new Date(statusUpdatedAt).toLocaleString(language),
            })}
          </p>
        ) : null}
      </div>
      <Select
        value={current}
        disabled={update.isPending}
        onValueChange={(value) => update.mutate(value as ClaimStatus)}
      >
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue aria-label={t("claimStatus.label")} />
        </SelectTrigger>
        <SelectContent>
          {CLAIM_STATUSES.map((item) => (
            <SelectItem key={item} value={item}>
              {t(`claimStatus.${item}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </section>
  );
}
