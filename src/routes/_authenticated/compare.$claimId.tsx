import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/language-provider";
import { buildComparison } from "@/lib/document-facts";
import { useClaimFacts } from "@/lib/use-claim-facts";
import { factLabel } from "@/components/contradictions-card";

export const Route = createFileRoute("/_authenticated/compare/$claimId")({
  head: () => ({
    meta: [
      { title: "Compare documents — EasyClaim" },
      {
        name: "description",
        content:
          "Compare the documents of one claim side by side and spot matching, different or missing details.",
      },
      { property: "og:title", content: "Compare your claim documents" },
      {
        property: "og:description",
        content: "A side-by-side table of names, dates, amounts and references.",
      },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { claimId } = Route.useParams();
  const { t } = useI18n();
  const { data, isPending } = useClaimFacts(claimId);
  const [excluded, setExcluded] = useState<string[]>([]);

  const documents = data ?? [];
  const selected = useMemo(
    () => documents.filter((doc) => !excluded.includes(doc.documentId)),
    [documents, excluded],
  );
  const rows = useMemo(
    () => (selected.length >= 2 ? buildComparison(selected) : []),
    [selected],
  );

  const statusStyles: Record<string, string> = {
    match: "bg-primary-soft text-primary",
    different: "bg-destructive/10 text-destructive",
    missing: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-8">
      <Link
        to="/analysis/$claimId"
        params={{ claimId }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("analysis.title")}
      </Link>

      <PageHeader title={t("compare.title")} description={t("compare.description")} />

      {isPending ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> {t("compare.loading")}
        </div>
      ) : documents.length === 0 ? (
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          {t("compare.empty")}
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to="/dashboard">{t("common.dashboard")}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <section className="surface-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("compare.select")}
            </h2>
            <div className="flex flex-wrap gap-4">
              {documents.map((doc) => (
                <label key={doc.documentId} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={!excluded.includes(doc.documentId)}
                    onCheckedChange={(checked) =>
                      setExcluded((current) =>
                        checked
                          ? current.filter((id) => id !== doc.documentId)
                          : [...current, doc.documentId],
                      )
                    }
                  />
                  {doc.fileName}
                </label>
              ))}
            </div>
          </section>

          {selected.length < 2 ? (
            <p className="text-sm text-muted-foreground">{t("compare.needsTwo")}</p>
          ) : (
            <section className="surface-card overflow-x-auto p-0">
              <table className="w-full min-w-[640px] text-start text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-3 text-start font-medium">{t("compare.field")}</th>
                    {selected.map((doc) => (
                      <th key={doc.documentId} className="p-3 text-start font-medium">
                        {doc.fileName}
                      </th>
                    ))}
                    <th className="p-3 text-start font-medium">{t("compare.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="border-b border-border/60 last:border-0">
                      <td className="p-3 font-medium text-foreground">
                        {factLabel(t, row.key, row.label)}
                      </td>
                      {selected.map((doc) => (
                        <td key={doc.documentId} className="p-3 text-muted-foreground">
                          {row.values[doc.documentId] || "—"}
                        </td>
                      ))}
                      <td className="p-3">
                        <Badge className={statusStyles[row.status]} variant="secondary">
                          {t(`compare.${row.status}`)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          <p className="text-xs text-muted-foreground">{t("compare.legend")}</p>
        </>
      )}
    </div>
  );
}
