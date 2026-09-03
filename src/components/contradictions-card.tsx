import { Link } from "@tanstack/react-router";
import { AlertTriangle, Columns3, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/loading";
import { useI18n } from "@/i18n/language-provider";
import { findContradictions, type ClaimDocumentFacts } from "@/lib/document-facts";
import { useClaimFacts } from "@/lib/use-claim-facts";

type TranslateFn = (key: string, options?: { defaultValue: string }) => string;

export function factLabel(t: TranslateFn, key: string, fallback: string) {
  if (key.startsWith("other:")) return fallback;
  return t(`facts.${key}`, { defaultValue: fallback });
}

export function ContradictionsCard({
  claimId,
  documentCount,
}: {
  claimId: string;
  documentCount: number;
}) {
  const { t } = useI18n();
  const enabled = documentCount >= 2;
  const { data, isFetching, isError, refetch } = useClaimFacts(claimId, enabled);

  const documents: ClaimDocumentFacts[] = data ?? [];
  const rows = findContradictions(documents);
  const names = new Map(documents.map((doc) => [doc.documentId, doc.fileName]));

  return (
    <section className="surface-card animate-rise p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <AlertTriangle className="size-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("contradictions.title")}
            </h2>
            <p className="text-xs text-muted-foreground">{t("contradictions.subtitle")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {enabled ? (
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {t("contradictions.rerun")}
            </Button>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <Link to="/compare/$claimId" params={{ claimId }}>
              <Columns3 className="size-4" /> {t("contradictions.openCompare")}
            </Link>
          </Button>
        </div>
      </div>

      {!enabled ? (
        <p className="text-sm text-muted-foreground">{t("contradictions.needsTwo")}</p>
      ) : isFetching && !data ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> {t("contradictions.checking")}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">{t("contradictions.failed")}</p>
      ) : rows.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" /> {t("contradictions.none")}
        </p>
      ) : (
        <div className="space-y-3">
          <Badge variant="secondary">{t("contradictions.found", { count: rows.length })}</Badge>
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.key} className="rounded-lg bg-muted/60 p-3">
                <p className="text-sm font-medium text-foreground">
                  {factLabel(t, row.key, row.label)}
                </p>
                <ul className="mt-2 space-y-1">
                  {documents.map((doc) => (
                    <li key={doc.documentId} className="flex flex-wrap gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {names.get(doc.documentId) ?? doc.fileName}:
                      </span>
                      <span className="font-medium text-foreground">
                        {row.values[doc.documentId] || t("contradictions.notStated")}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{t("contradictions.hint")}</p>
        </div>
      )}
    </section>
  );
}
