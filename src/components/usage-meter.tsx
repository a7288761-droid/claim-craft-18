import { Link } from "@tanstack/react-router";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/language-provider";
import { useSubscription } from "@/lib/subscription";

function Row({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {used} / {limit}
        </span>
      </div>
      <Progress value={pct} />
    </div>
  );
}

export function UsageMeter({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const { data } = useSubscription();
  if (!data) return null;

  return (
    <section className="surface-card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{t("plans.usageTitle")}</h2>
          <p className="text-xs text-muted-foreground">
            {t("plans.currentPlan")}: {t(`plans.${data.plan}.name`)}
            {data.periodEnd ? ` · ${t("plans.resetsOn", { date: data.periodEnd })}` : ""}
          </p>
        </div>
        {compact ? null : (
          <Button asChild size="sm" variant="outline">
            <Link to="/plans">{t("plans.viewPlans")}</Link>
          </Button>
        )}
      </div>
      <Row label={t("plans.analyses")} used={data.used.analyses} limit={data.limits.analyses} />
      <Row label={t("plans.letters")} used={data.used.letters} limit={data.limits.letters} />
    </section>
  );
}
