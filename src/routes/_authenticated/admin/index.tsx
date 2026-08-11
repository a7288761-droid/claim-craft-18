import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminStats } from "@/lib/admin.functions";
import { RowsSkeleton } from "@/components/loading";
import { CLAIM_STATUSES } from "@/lib/claim-status";
import { PLAN_IDS } from "@/lib/subscription";
import { useI18n } from "@/i18n/language-provider";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin overview — EasyClaim" },
      { name: "description", content: "Platform-wide EasyClaim statistics for administrators." },
      { property: "og:title", content: "EasyClaim admin overview" },
      { property: "og:description", content: "Users, claims, analyses and monthly AI usage." },
    ],
  }),
  component: AdminOverview,
});

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function AdminOverview() {
  const { t } = useI18n();
  const fetchStats = useServerFn(adminStats);
  const { data, isPending } = useQuery({ queryKey: ["admin", "stats"], queryFn: () => fetchStats() });

  if (isPending || !data) return <RowsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("admin.totalUsers")} value={data.totalUsers} />
        <Stat label={t("admin.totalClaims")} value={data.totalClaims} />
        <Stat label={t("admin.totalAnalyses")} value={data.totalAnalyses} />
        <Stat label={t("admin.totalLetters")} value={data.totalLetters} />
        <Stat label={t("admin.needsAction")} value={data.needsAction} />
        <Stat label={t("admin.monthlyAnalyses")} value={data.monthlyUsage.analyses} />
        <Stat label={t("admin.monthlyLetters")} value={data.monthlyUsage.letters} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface-card space-y-3 p-5">
          <h2 className="text-sm font-semibold text-foreground">{t("admin.usersByPlan")}</h2>
          <ul className="space-y-2 text-sm">
            {PLAN_IDS.map((plan) => (
              <li key={plan} className="flex items-center justify-between">
                <span className="text-muted-foreground">{t(`plans.${plan}.name`)}</span>
                <span className="font-medium text-foreground">{data.planCounts[plan] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card space-y-3 p-5">
          <h2 className="text-sm font-semibold text-foreground">{t("admin.claimsByStatus")}</h2>
          <ul className="space-y-2 text-sm">
            {CLAIM_STATUSES.map((status) => (
              <li key={status} className="flex items-center justify-between">
                <span className="text-muted-foreground">{t(`claimStatus.${status}`)}</span>
                <span className="font-medium text-foreground">{data.statusCounts[status] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}