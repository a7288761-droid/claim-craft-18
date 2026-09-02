import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, CircleAlert, FileText, ListChecks, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { CardsSkeleton } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExportReportButton } from "@/components/export-report-button";
import { useI18n } from "@/i18n/language-provider";
import { getCategory } from "@/lib/categories";
import { findContradictions } from "@/lib/document-facts";
import { useClaimFacts } from "@/lib/use-claim-facts";
import type { AnalysisSection } from "@/services/types";

export const Route = createFileRoute("/_authenticated/package/$claimId")({
  head: () => ({
    meta: [
      { title: "Appeal package — EasyClaim" },
      {
        name: "description",
        content:
          "Your appeal letter, claim summary, evidence list and a smart checklist in one exportable package.",
      },
      { property: "og:title", content: "Your complete EasyClaim appeal package" },
      {
        property: "og:description",
        content: "Letter, summary, evidence and checklist ready to submit.",
      },
    ],
  }),
  component: PackagePage,
});

function asSections(value: unknown): AnalysisSection[] {
  return Array.isArray(value) ? (value as AnalysisSection[]) : [];
}

type ChecklistItem = { id: string; label: string; done: boolean };

function PackagePage() {
  const { claimId } = Route.useParams();
  const { t } = useI18n();

  const { data, isPending } = useQuery({
    queryKey: ["appeal-package", claimId],
    queryFn: async () => {
      const [claim, analysis, documents, letter] = await Promise.all([
        supabase.from("claims").select("*").eq("id", claimId).maybeSingle(),
        supabase
          .from("analysis_results")
          .select("*")
          .eq("claim_id", claimId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("documents").select("id, file_name").eq("claim_id", claimId),
        supabase
          .from("generated_letters")
          .select("*")
          .eq("claim_id", claimId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      return {
        claim: claim.data,
        analysis: analysis.data,
        documents: documents.data ?? [],
        letter: letter.data,
      };
    },
  });

  const documentCount = data?.documents.length ?? 0;
  const { data: facts } = useClaimFacts(claimId, documentCount >= 2);
  const contradictions = findContradictions(facts ?? []);

  if (isPending) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("packet.title")} description={t("packet.description")} />
        <CardsSkeleton count={3} />
      </div>
    );
  }

  if (!data?.claim) {
    return (
      <div className="surface-card p-8 text-center text-sm text-muted-foreground">
        {t("analysis.noneText")}
        <div className="mt-4">
          <Button asChild>
            <Link to="/dashboard">{t("analysis.goToDashboard")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { claim, analysis, documents, letter } = data;
  const category = getCategory(claim.category);
  const categoryName = category
    ? t(`categories.${category.slug}.name`, { defaultValue: category.name })
    : claim.category;
  const title = t("workspace.claimTitle", { category: categoryName });
  const summary = analysis?.summary ?? "";

  const checklist: ChecklistItem[] = [
    { id: "documents", label: t("packet.items.documents"), done: documents.length > 0 },
    { id: "letter", label: t("packet.items.letter"), done: !!letter },
    {
      id: "contradictions",
      label:
        contradictions.length > 0
          ? t("packet.items.contradictionsTodo", { count: contradictions.length })
          : t("packet.items.contradictions"),
      done: contradictions.length === 0,
    },
    {
      id: "deadline",
      label:
        analysis?.deadline_date || claim.deadline_at
          ? t("packet.items.deadline")
          : t("packet.items.deadlineTodo"),
      done: !!(analysis?.deadline_date || claim.deadline_at),
    },
    ...asSections(analysis?.missing_information).map((item, index) => ({
      id: `missing-${index}`,
      label: t("packet.items.missing", { item: item.label }),
      done: false,
    })),
    ...asSections(analysis?.strength_improvements).map((item, index) => ({
      id: `improve-${index}`,
      label: t("packet.items.improve", { item: item.label }),
      done: false,
    })),
  ];
  const doneCount = checklist.filter((item) => item.done).length;

  return (
    <div className="space-y-8">
      <Link
        to="/analysis/$claimId"
        params={{ claimId }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("analysis.title")}
      </Link>

      <PageHeader
        title={t("packet.title")}
        description={t("packet.description")}
        action={
          <div className="flex flex-wrap gap-2">
            <ExportReportButton
              title={`${t("packet.title")} — ${title}`}
              summary={summary}
              fileName="easyclaim-appeal-package.pdf"
              label={t("packet.export")}
              successMessage={t("packet.exported")}
              sections={[
                {
                  heading: t("packet.letter"),
                  items: letter ? [{ label: letter.title, value: letter.body }] : [],
                },
                {
                  heading: t("packet.evidence"),
                  items: documents.map((document) => ({
                    label: document.file_name,
                    value: t("packet.evidenceCount", { count: documents.length }),
                  })),
                },
                {
                  heading: t("packet.checklist"),
                  items: checklist.map((item) => ({
                    label: item.done ? t("packet.ready") : t("packet.todo"),
                    value: item.label,
                  })),
                },
              ]}
            />
            <Button asChild>
              <Link to="/letter/$claimId" params={{ claimId }}>
                <FileText className="size-4" />
                {letter ? t("packet.letter") : t("packet.generateLetter")}
              </Link>
            </Button>
          </div>
        }
      />

      <section className="surface-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
            <FileText className="size-4.5" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("packet.letter")}
          </h2>
        </div>
        {letter ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {letter.body}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{t("packet.noLetter")}</p>
        )}
      </section>

      {summary ? (
        <section className="surface-card p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("packet.summary")}
          </h2>
          <p className="text-sm leading-relaxed text-foreground">{summary}</p>
        </section>
      ) : null}

      <section className="surface-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
            <Paperclip className="size-4.5" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("packet.evidence")}
          </h2>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          {t("packet.evidenceCount", { count: documents.length })}
        </p>
        <div className="flex flex-wrap gap-2">
          {documents.map((document) => (
            <Badge key={document.id} variant="secondary" className="gap-1.5">
              <FileText className="size-3.5" />
              {document.file_name}
            </Badge>
          ))}
        </div>
      </section>

      <section className="surface-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
            <ListChecks className="size-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("packet.checklist")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("packet.progress", { done: doneCount, total: checklist.length })}
            </p>
          </div>
        </div>
        <ul className="space-y-2">
          {checklist.map((item) => (
            <li key={item.id} className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-sm">
              {item.done ? (
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
              )}
              <span className="text-foreground">{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-muted-foreground">{t("analysis.footerNote")}</p>
    </div>
  );
}
