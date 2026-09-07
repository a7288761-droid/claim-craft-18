import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getCategory } from "@/lib/categories";
import { PageHeader } from "@/components/page-header";
import { FileUploader, type PendingFile } from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getAnalysisEngine, storageService, extractionService } from "@/services";
import { AnalysisProgress, ANALYSIS_STEPS } from "@/components/analysis-progress";
import { notifyMany, type NotificationInput } from "@/lib/claim-notifications";
import { useI18n } from "@/i18n/language-provider";
import { UsageMeter } from "@/components/usage-meter";
import { QuotaLimitNotice } from "@/components/quota-limit-notice";
import {
  parseQuotaError,
  remaining,
  subscriptionQueryKey,
  useSubscription,
} from "@/lib/subscription";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { extractClaimFacts } from "@/lib/documents.functions";
import { claimFactsQueryKey } from "@/lib/use-claim-facts";

export const Route = createFileRoute("/_authenticated/workspace/$category")({
  head: () => ({
    meta: [
      { title: "Upload documents — EasyClaim" },
      {
        name: "description",
        content: "Upload your policy, receipts or tickets and start an AI-assisted claim analysis.",
      },
      { property: "og:title", content: "Start a claim with EasyClaim" },
      { property: "og:description", content: "Upload documents and prepare your appeal draft." },
    ],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  const { category: slug } = Route.useParams();
  const category = getCategory(slug);
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const { data: subscription } = useSubscription();
  const runExtractFacts = useServerFn(extractClaimFacts);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [quotaBlocked, setQuotaBlocked] = useState<{ limit: number; plan: string } | null>(null);

  if (!category) {
    return (
      <div className="surface-card p-10 text-center">
        <h1 className="text-lg font-semibold">{t("workspace.notFound")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("workspace.notFoundText")}</p>
        <Button asChild className="mt-4">
          <Link to="/dashboard">{t("common.backToDashboard")}</Link>
        </Button>
      </div>
    );
  }

  const valid = files.filter((item) => !item.error);
  const analysesLeft = remaining(subscription, "analyses");
  const outOfQuota =
    quotaBlocked !== null || (subscription !== undefined && analysesLeft !== null && analysesLeft <= 0);
  const categoryName = t(`categories.${category.slug}.name`, { defaultValue: category.name });
  const categoryDescription = t(`categories.${category.slug}.description`, {
    defaultValue: category.description,
  });
  const examples = t(`categories.${category.slug}.examples`, {
    returnObjects: true,
    defaultValue: category.examples,
  }) as string[];

  async function handleAnalyze() {
    if (!category) return;
    if (valid.length === 0) {
      toast.error(t("workspace.needFile"));
      return;
    }
    if (outOfQuota) return;
    setBusy(true);
    setStep(0);
    let userId: string | null = null;
    let currentClaimId: string | null = null;
    try {
      const { data: auth } = await supabase.auth.getUser();
      userId = auth.user!.id;

      const { data: claim, error: claimError } = await supabase
        .from("claims")
        .insert({
          user_id: userId,
          category: category.slug,
          title: `${category.name} claim`,
          status: "analysing",
          notes: notes.trim() || null,
        })
        .select()
        .single();
      if (claimError) throw claimError;
      currentClaimId = claim.id;

      const extracts: string[] = [];
      for (const item of valid) {
        const path = await storageService.upload(userId, item.file, (percent) =>
          setFiles((current) =>
            current.map((entry) => (entry.id === item.id ? { ...entry, progress: percent } : entry)),
          ),
        );
        setStep(1);
        const extracted = await extractionService.extract(item.file);
        extracts.push(`--- ${item.file.name} ---\n${extracted.text}`);
        const { error: docError } = await supabase.from("documents").insert({
          user_id: userId,
          claim_id: claim.id,
          file_name: item.file.name,
          file_type: item.file.type || "application/octet-stream",
          file_size: item.file.size,
          storage_path: path,
          status: "extracted",
          extracted_text: extracted.text,
        });
        if (docError) throw docError;
      }
      setStep(2);

      const analysis = await getAnalysisEngine().analyze({
        category: category.slug,
        categoryName: category.name,
        fileNames: valid.map((item) => item.file.name),
        notes,
        extractedText: extracts.join("\n\n"),
        language,
      });
      setStep(3);

      const { error: analysisError } = await supabase.from("analysis_results").insert({
        user_id: userId,
        claim_id: claim.id,
        summary: analysis.summary,
        key_clauses: analysis.keyClauses,
        rejection_reasons: analysis.rejectionReasons,
        missing_information: analysis.missingInformation,
        user_rights: analysis.userRights,
        key_entities: analysis.keyEntities,
        important_dates: analysis.importantDates,
        financial_amounts: analysis.financialAmounts,
        next_steps: analysis.nextSteps,
        strength_level: analysis.strengthLevel,
        strength_reasons: analysis.strengthReasons,
        strength_improvements: analysis.strengthImprovements,
        deadline_date: analysis.deadlineDate || null,
        deadline_note: analysis.deadlineNote || null,
        engine: analysis.engine,
      });
      if (analysisError) throw analysisError;
      setStep(ANALYSIS_STEPS.length);

      // Extract the comparable fact sheet of every uploaded document so the
      // contradiction detector, comparison table and appeal package are ready.
      try {
        const facts = await runExtractFacts({ data: { claimId: claim.id, force: true } });
        queryClient.setQueryData(claimFactsQueryKey(claim.id), facts);
      } catch (factsError) {
        console.error("fact extraction failed", factsError);
      }



      const needsInfo = analysis.missingInformation.length > 0;
      await supabase
        .from("claims")
        .update({
          status: needsInfo ? "needs_info" : "ready_to_appeal",
          deadline_at: analysis.deadlineDate || null,
          deadline_note: analysis.deadlineNote || null,
        })
        .eq("id", claim.id);

      const alerts: NotificationInput[] = [
        {
          userId,
          claimId: claim.id,
          type: "success",
          title: t("workspace.notificationTitle"),
          message: t("workspace.notificationMessage", { category: categoryName }),
        },
      ];
      if (needsInfo) {
        alerts.push({
          userId,
          claimId: claim.id,
          type: "warning",
          title: t("notify.missingInfoTitle"),
          message: t("notify.missingInfo", { count: analysis.missingInformation.length }),
        });
      } else {
        alerts.push({
          userId,
          claimId: claim.id,
          type: "info",
          title: t("notify.readyToAppealTitle"),
          message: t("notify.readyToAppeal", { category: categoryName }),
        });
      }
      if (analysis.deadlineDate) {
        alerts.push({
          userId,
          claimId: claim.id,
          type: "warning",
          title: t("notify.deadlineFoundTitle"),
          message: t("notify.deadlineFound", { date: analysis.deadlineDate }),
        });
      }
      await notifyMany(alerts);
      await queryClient.invalidateQueries({ queryKey: subscriptionQueryKey });

      navigate({ to: "/analysis/$claimId", params: { claimId: claim.id } });
    } catch (error) {
      console.error(error);
      if (currentClaimId && userId) {
        await supabase
          .from("claims")
          .update({ status: "draft" })
          .eq("id", currentClaimId)
          .eq("user_id", userId);
      }
      const quota = parseQuotaError(error);
      if (quota) {
        setQuotaBlocked({ limit: quota.limit, plan: quota.plan });
        await queryClient.invalidateQueries({ queryKey: subscriptionQueryKey });
        setBusy(false);
        return;
      }
      const message =
        error instanceof Error && error.message
          ? error.message
          : t("workspace.failed");
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("common.dashboard")}
      </Link>

      <PageHeader title={categoryName} description={categoryDescription} />

      <UsageMeter />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          {outOfQuota ? (
            <QuotaLimitNotice
              kind="analysis"
              limit={quotaBlocked?.limit ?? subscription?.limits.analyses ?? 0}
              plan={quotaBlocked?.plan ?? subscription?.plan ?? "free"}
            />
          ) : null}
          <FileUploader files={files} onChange={setFiles} disabled={busy} />

          {busy ? <AnalysisProgress activeIndex={step} /> : null}

          <div className="surface-card space-y-2 p-5">
            <Label htmlFor="notes">{t("workspace.notesLabel")}</Label>
            <Textarea
              id="notes"
              value={notes}
              maxLength={1000}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t("workspace.notesPlaceholder")}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{notes.length}/1000</p>
          </div>

          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={handleAnalyze}
            disabled={busy || outOfQuota}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t("workspace.analysing")}
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> {t("workspace.analyse")}
              </>
            )}
          </Button>
        </div>

        <aside className="surface-card h-fit p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("workspace.helpfulDocuments")}
          </h2>
          <ul className="mt-3 space-y-2">
            {examples.map((example) => (
              <li key={example} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                {example}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-muted-foreground">{t("common.disclaimer")}</p>
        </aside>
      </div>
    </div>
  );
}