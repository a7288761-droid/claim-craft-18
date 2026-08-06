import type { LucideIcon } from "lucide-react";
import type { AnalysisSection as SectionItem } from "@/services/types";

export function AnalysisSectionCard({
  icon: Icon,
  title,
  items,
  body,
}: {
  icon: LucideIcon;
  title: string;
  items?: SectionItem[];
  body?: string;
}) {
  return (
    <section className="surface-card animate-rise p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="size-4.5" />
        </div>
        <h2 className="truncate text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
      </div>
      {body ? <p className="text-sm leading-relaxed text-foreground">{body}</p> : null}
      {items?.length ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.label} className="rounded-lg bg-muted/60 p-3">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{item.value}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}