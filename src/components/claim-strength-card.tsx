import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/language-provider";
import type { AnalysisSection } from "@/services/types";

const TONE: Record<string, string> = {
  strong: "bg-primary-soft text-primary",
  moderate: "bg-muted text-foreground",
  needs_more_info: "bg-destructive/10 text-destructive",
};

export function ClaimStrengthCard({
  level,
  reasons,
  improvements,
}: {
  level: string;
  reasons: AnalysisSection[];
  improvements: AnalysisSection[];
}) {
  const { t } = useI18n();
  const normalized = level in TONE ? level : "needs_more_info";

  return (
    <section className="surface-card animate-rise p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <Gauge className="size-4.5" />
        </div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("strength.title")}
        </h2>
        <span
          className={cn(
            "ms-auto inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
            TONE[normalized],
          )}
        >
          {t(`strength.level.${normalized}`)}
        </span>
      </div>

      {reasons.length > 0 ? (
        <>
          <h3 className="text-xs font-semibold text-foreground">{t("strength.reasons")}</h3>
          <ul className="mt-2 space-y-2">
            {reasons.map((item) => (
              <li key={item.label} className="rounded-lg bg-muted/60 p-3">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.value}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {improvements.length > 0 ? (
        <>
          <h3 className="mt-5 text-xs font-semibold text-foreground">
            {t("strength.improvements")}
          </h3>
          <ul className="mt-2 space-y-2">
            {improvements.map((item) => (
              <li key={item.label} className="rounded-lg bg-muted/60 p-3">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.value}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="mt-5 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        {t("strength.disclaimer")}
      </p>
    </section>
  );
}
