import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Minus } from "lucide-react";
import { adminPlans } from "@/lib/admin.functions";
import { RowsSkeleton } from "@/components/loading";
import { useI18n } from "@/i18n/language-provider";

export const Route = createFileRoute("/_authenticated/admin/plans")({
  head: () => ({
    meta: [
      { title: "Admin plans — EasyClaim" },
      { name: "description", content: "Review EasyClaim plan limits and how many accounts use each tier." },
      { property: "og:title", content: "EasyClaim admin plans" },
      { property: "og:description", content: "Monthly limits and feature flags per plan." },
    ],
  }),
  component: AdminPlans,
});

function Flag({ on }: { on: boolean }) {
  return on ? (
    <Check className="size-4 text-primary" />
  ) : (
    <Minus className="size-4 text-muted-foreground" />
  );
}

function AdminPlans() {
  const { t } = useI18n();
  const fetchPlans = useServerFn(adminPlans);
  const { data, isPending } = useQuery({ queryKey: ["admin", "plans"], queryFn: () => fetchPlans() });

  if (isPending || !data) return <RowsSkeleton />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("admin.plansNote")}</p>
      <div className="grid gap-4 lg:grid-cols-3">
        {data.map((plan) => (
          <div key={plan.id} className="surface-card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                {t(`plans.${plan.id}.name`, { defaultValue: plan.id })}
              </h2>
              <span className="text-xs text-muted-foreground">
                {t("admin.usersOnPlan", { count: plan.users })}
              </span>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t("plans.analyses")}</dt>
                <dd className="font-medium text-foreground">{plan.monthlyAnalyses}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t("plans.letters")}</dt>
                <dd className="font-medium text-foreground">{plan.monthlyLetters}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t("plans.featureAdvancedAnalysis")}</dt>
                <dd>
                  <Flag on={plan.advancedAnalysis} />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t("plans.featureExports")}</dt>
                <dd>
                  <Flag on={plan.exports} />
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}