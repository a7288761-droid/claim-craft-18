import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/language-provider";

export function QuotaLimitNotice({
  kind,
  limit,
  plan,
}: {
  kind: "analysis" | "letter";
  limit: number;
  plan: string;
}) {
  const { t } = useI18n();
  const planName = t(`plans.${plan}.name`, { defaultValue: plan });
  return (
    <div className="surface-card space-y-3 border-warning/40 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">{t("quota.limitReachedTitle")}</h2>
          <p className="text-sm text-muted-foreground">
            {t(kind === "analysis" ? "quota.analysisLimit" : "quota.letterLimit", {
              limit,
              plan: planName,
            })}
          </p>
          <p className="text-sm text-muted-foreground">{t("quota.upgrade")}</p>
        </div>
      </div>
      <Button asChild size="sm">
        <Link to="/plans">{t("quota.seePlans")}</Link>
      </Button>
    </div>
  );
}
