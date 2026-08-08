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
import { useI18n } from "@/i18n/language-provider";

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
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);

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
    setBusy(true);
    setStep(0);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user!.id;

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
        engine: analysis.engine,
      });
      if (analysisError) throw analysisError;
      setStep(ANALYSIS_STEPS.length);

      await supabase.from("claims").update({ status: "analysed" }).eq("id", claim.id);
      await supabase.from("notifications").insert({
        user_id: userId,
        title: t("workspace.notificationTitle"),
        message: t("workspace.notificationMessage", { category: categoryName }),
        type: "success",
      });

      navigate({ to: "/analysis/$claimId", params: { claimId: claim.id } });
    } catch (error) {
      console.error(error);
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
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

          <Button size="lg" className="w-full sm:w-auto" onClick={handleAnalyze} disabled={busy}>
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