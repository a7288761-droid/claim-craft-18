import { CalendarClock } from "lucide-react";
import { daysUntil } from "@/lib/claim-status";
import { useI18n } from "@/i18n/language-provider";

export function ClaimDeadlineCard({
  date,
  note,
}: {
  date?: string | null;
  note?: string | null;
}) {
  const { t, language } = useI18n();
  const left = daysUntil(date);

  return (
    <section className="surface-card animate-rise p-6">
      <div className="mb-3 flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <CalendarClock className="size-4.5" />
        </div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("deadline.title")}
        </h2>
      </div>
      {date ? (
        <>
          <p className="text-lg font-semibold text-foreground">
            {new Date(`${date}T00:00:00`).toLocaleDateString(language, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          {left !== null ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {left < 0 ? t("deadline.passed") : t("deadline.daysLeft", { count: left })}
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("deadline.none")}</p>
      )}
      {note ? <p className="mt-2 text-sm text-muted-foreground">{note}</p> : null}
    </section>
  );
}
