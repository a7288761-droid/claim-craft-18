import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, Download, Printer, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { getAnalysisEngine } from "@/services";
import { getCategory } from "@/lib/categories";
import type { AnalysisPayload, AnalysisSection } from "@/services/types";

export const Route = createFileRoute("/_authenticated/letter/$claimId")({
  head: () => ({
    meta: [
      { title: "Appeal letter — EasyClaim" },
      {
        name: "description",
        content: "A professional appeal letter draft you can copy, download or print.",
      },
      { property: "og:title", content: "Your EasyClaim appeal letter" },
      { property: "og:description", content: "Copy, download or print your claim appeal draft." },
    ],
  }),
  component: LetterPage,
});

function asSections(value: unknown): AnalysisSection[] {
  return Array.isArray(value) ? (value as AnalysisSection[]) : [];
}

function LetterPage() {
  const { claimId } = Route.useParams();
  const [copied, setCopied] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ["letter", claimId],
    queryFn: async () => {
      const [claim, existing, analysis] = await Promise.all([
        supabase.from("claims").select("*").eq("id", claimId).maybeSingle(),
        supabase
          .from("generated_letters")
          .select("*")
          .eq("claim_id", claimId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("analysis_results")
          .select("*")
          .eq("claim_id", claimId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!claim.data) return null;
      if (existing.data) return { claim: claim.data, body: existing.data.body };

      const category = getCategory(claim.data.category);
      const payload: AnalysisPayload = {
        summary: analysis.data?.summary ?? "",
        keyClauses: asSections(analysis.data?.key_clauses),
        rejectionReasons: asSections(analysis.data?.rejection_reasons),
        importantDates: asSections(analysis.data?.important_dates),
        financialAmounts: asSections(analysis.data?.financial_amounts),
        nextSteps: asSections(analysis.data?.next_steps),
        engine: analysis.data?.engine ?? "placeholder",
      };

      const body = await getAnalysisEngine().draftLetter({
        category: claim.data.category,
        categoryName: category?.name ?? claim.data.category,
        fileNames: [],
        analysis: payload,
      });

      const { data: auth } = await supabase.auth.getUser();
      await supabase.from("generated_letters").insert({
        user_id: auth.user!.id,
        claim_id: claimId,
        title: `${category?.name ?? "Claim"} appeal letter`,
        body,
      });

      return { claim: claim.data, body };
    },
  });

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (isPending) return <Spinner label="Drafting your appeal letter…" />;

  if (!data) {
    return (
      <div className="surface-card p-10 text-center">
        <h1 className="text-lg font-semibold">Letter unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">We couldn&apos;t find this claim.</p>
        <Button asChild className="mt-4">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  function handleCopy() {
    navigator.clipboard.writeText(data!.body);
    setCopied(true);
    toast.success("Letter copied to clipboard");
  }

  function handleDownload() {
    const blob = new Blob([data!.body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "easyclaim-appeal-letter.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <Link
        to="/analysis/$claimId"
        params={{ claimId }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground print:hidden"
      >
        <ArrowLeft className="size-4" /> Back to analysis
      </Link>

      <div className="print:hidden">
        <PageHeader
          title="Appeal letter"
          description="Review the draft, personalise the bracketed fields, then send it to the provider."
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />} Copy
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="size-4" /> Download
              </Button>
              <Button onClick={() => window.print()}>
                <Printer className="size-4" /> Print
              </Button>
            </div>
          }
        />
      </div>

      <article className="surface-card animate-rise whitespace-pre-wrap p-6 font-serif text-sm leading-7 text-foreground sm:p-10">
        {data.body}
      </article>
    </div>
  );
}