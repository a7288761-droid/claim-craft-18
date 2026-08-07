import { Check, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type AnalysisStep = {
  id: string;
  label: string;
};

export const ANALYSIS_STEPS: AnalysisStep[] = [
  { id: "upload", label: "Uploading your documents" },
  { id: "extract", label: "Extracting text from each file" },
  { id: "analyze", label: "Analysing clauses and risks" },
  { id: "save", label: "Saving the analysis to your history" },
];

export function AnalysisProgress({
  activeIndex,
  steps = ANALYSIS_STEPS,
}: {
  activeIndex: number;
  steps?: AnalysisStep[];
}) {
  const percent = Math.min(100, Math.round((activeIndex / steps.length) * 100));

  return (
    <section className="surface-card animate-rise space-y-4 p-6" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-foreground">Analysing your claim</h2>
        <span className="text-xs text-muted-foreground">{percent}%</span>
      </div>
      <Progress value={percent} className="h-2" />
      <ul className="space-y-3">
        {steps.map((step, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li key={step.id} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border",
                  done && "border-transparent bg-primary text-primary-foreground",
                  active && "border-primary text-primary",
                  !done && !active && "border-border text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="size-3.5" />
                ) : active ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <span className="text-[11px]">{index + 1}</span>
                )}
              </span>
              <span className={cn(done || active ? "text-foreground" : "text-muted-foreground")}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}