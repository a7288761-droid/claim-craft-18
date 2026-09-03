import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Coins,
  Columns3,
  FileSearch,
  FileText,
  ListChecks,
  HelpCircle,
  IdCard,
  PackageCheck,
  ShieldCheck,
  ScrollText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { AnalysisSectionCard } from "@/components/analysis-section";
import { ClaimStatusControl } from "@/components/claim-status-control";
import { ClaimStrengthCard } from "@/components/claim-strength-card";
import { ClaimDeadlineCard } from "@/components/claim-deadline-card";
import { ContradictionsCard } from "@/components/contradictions-card";
import { AskDocumentCard } from "@/components/ask-document-card";
import { EmptyState } from "@/components/empty-state";
import { CardsSkeleton } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AnalysisSection } from "@/services/types";
import { useI18n } from "@/i18n/language-provider";
import { getCategory } from "@/lib/categories";
import { ExportReportButton } from "@/components/export-report-button";


export const Route = createFileRoute("/_authenticated/analysis/$claimId")({
  head: () => ({
    meta: [
      { title: "Document analysis — EasyClaim" },
      {
        name: "description",
        content:
          "Summary, key clauses, rejection risks, dates, amounts and next steps for your claim.",
      },
      { property: "og:title", content: "Your EasyClaim document analysis" },
      { property: "og:description", content: "A clear breakdown of your uploaded documents." },
    ],
  }),
  component: AnalysisPage,
});

function asSections(value: unknown): AnalysisSection[] {
  return Array.isArray(value) ? (value as AnalysisSection[]) : [];
}

function AnalysisPage() {
  const { claimId } = Route.useParams();
  const { t, language } = useI18n();

  const { data, isPending } = useQuery({
    queryKey: ["analysis", claimId],
    queryFn: async () => {
      const [claim, analysis, documents] = await Promise.all([
        supabase.from("claims").select("*").eq("id", claimId).maybeSingle(),
        supabase
          .from("analysis_results")
          .select("*")
          .eq("claim_id", claimId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("documents").select("*").eq("claim_id", claimId),
      ]);
      return {
        claim: claim.data,
        analysis: analysis.data,
        documents: documents.data ?? [],
      };
    },
  });

  if (isPending) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("analysis.title")} description={t("analysis.preparing")} />
        <CardsSkeleton count={4} />
      </div>
    );
  }

  if (!data?.claim || !data.analysis) {
    return (
      <EmptyState
        icon={FileSearch}
        title={t("analysis.noneTitle")}
        description={t("analysis.noneText")}
        action={
          <Button asChild>
            <Link to="/dashboard">{t("analysis.goToDashboard")}</Link>
          </Button>
        }
      />
    );
  }

  const { claim, analysis, documents } = data;
  const category = getCategory(claim.category);
  const categoryName = category
    ? t(`categories.${category.slug}.name`, { defaultValue: category.name })
    : claim.category;

  return (
    <div className="space-y-8">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("common.dashboard")}
      </Link>

      <PageHeader
        title={t("workspace.claimTitle", { category: categoryName })}
        description={t("analysis.analysedOn", {
          date: new Date(analysis.created_at).toLocaleDateString(language),
        })}
        action={
          <div className="flex flex-wrap gap-2">
            <ExportReportButton
              title={t("workspace.claimTitle", { category: categoryName })}
              summary={analysis.summary ?? ""}
              sections={[
                { heading: t("analysis.keyClauses"), items: asSections(analysis.key_clauses) },
                {
                  heading: t("analysis.rejectionReasons"),
                  items: asSections(analysis.rejection_reasons),
                },
                {
                  heading: t("analysis.missingInformation"),
                  items: asSections(analysis.missing_information),
                },
                { heading: t("analysis.userRights"), items: asSections(analysis.user_rights) },
                { heading: t("analysis.keyEntities"), items: asSections(analysis.key_entities) },
                {
                  heading: t("analysis.importantDates"),
                  items: asSections(analysis.important_dates),
                },
                {
                  heading: t("analysis.financialAmounts"),
                  items: asSections(analysis.financial_amounts),
                },
                { heading: t("analysis.nextSteps"), items: asSections(analysis.next_steps) },
              ]}
            />
            <Button variant="outline" asChild>
              <Link to="/compare/$claimId" params={{ claimId }}>
                <Columns3 className="size-4" /> {t("compare.title")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/package/$claimId" params={{ claimId }}>
                <PackageCheck className="size-4" /> {t("packet.open")}
              </Link>
            </Button>
            <Button asChild>
              <Link to="/letter/$claimId" params={{ claimId }}>
                <FileText className="size-4" /> {t("analysis.generateLetter")}
              </Link>
            </Button>
          </div>
        }
      />

      {documents.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {documents.map((document) => (
            <Badge key={document.id} variant="secondary" className="gap-1.5">
              <FileText className="size-3.5" />
              {document.file_name}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <ClaimStatusControl
            claimId={claimId}
            status={claim.status}
            statusUpdatedAt={claim.status_updated_at ?? claim.updated_at}
          />
        </div>
        <ClaimStrengthCard
          level={analysis.strength_level ?? "needs_more_info"}
          reasons={asSections(analysis.strength_reasons)}
          improvements={asSections(analysis.strength_improvements)}
        />
        <ClaimDeadlineCard
          date={analysis.deadline_date ?? claim.deadline_at}
          note={analysis.deadline_note ?? claim.deadline_note}
        />
        <div className="lg:col-span-2">
          <AnalysisSectionCard
            icon={FileSearch}
            title={t("analysis.summary")}
            body={analysis.summary ?? ""}
          />
        </div>
        <AnalysisSectionCard
          icon={ScrollText}
          title={t("analysis.keyClauses")}
          items={asSections(analysis.key_clauses)}
        />
        <AnalysisSectionCard
          icon={AlertTriangle}
          title={t("analysis.rejectionReasons")}
          items={asSections(analysis.rejection_reasons)}
        />
        <AnalysisSectionCard
          icon={HelpCircle}
          title={t("analysis.missingInformation")}
          items={asSections(analysis.missing_information)}
        />
        <AnalysisSectionCard
          icon={ShieldCheck}
          title={t("analysis.userRights")}
          items={asSections(analysis.user_rights)}
        />
        <AnalysisSectionCard
          icon={IdCard}
          title={t("analysis.keyEntities")}
          items={asSections(analysis.key_entities)}
        />
        <AnalysisSectionCard
          icon={CalendarDays}
          title={t("analysis.importantDates")}
          items={asSections(analysis.important_dates)}
        />
        <AnalysisSectionCard
          icon={Coins}
          title={t("analysis.financialAmounts")}
          items={asSections(analysis.financial_amounts)}
        />
        <div className="lg:col-span-2">
          <AnalysisSectionCard
            icon={ListChecks}
            title={t("analysis.nextSteps")}
            items={asSections(analysis.next_steps)}
          />
        </div>
        <div className="lg:col-span-2">
          <ContradictionsCard claimId={claimId} documentCount={documents.length} />
        </div>
        <div className="lg:col-span-2">
          <AskDocumentCard claimId={claimId} />
        </div>
      </div>


      <p className="text-xs text-muted-foreground">{t("analysis.footerNote")}</p>
    </div>
  );
}