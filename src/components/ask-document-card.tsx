import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessagesSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/loading";
import { supabase } from "@/integrations/supabase/client";
import { askMyDocument } from "@/lib/documents.functions";
import { useI18n } from "@/i18n/language-provider";

type QuestionRow = {
  id: string;
  question: string;
  answer: string;
  sources: { document: string; excerpt: string }[];
  created_at: string;
};

export function AskDocumentCard({ claimId }: { claimId: string }) {
  const { t, language } = useI18n();
  const [question, setQuestion] = useState("");
  const queryClient = useQueryClient();
  const ask = useServerFn(askMyDocument);
  const historyKey = ["document-questions", claimId] as const;

  const { data: history, isPending } = useQuery({
    queryKey: historyKey,
    queryFn: async (): Promise<QuestionRow[]> => {
      const { data, error } = await supabase
        .from("document_questions")
        .select("id, question, answer, sources, created_at")
        .eq("claim_id", claimId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: row.id,
        question: row.question,
        answer: row.answer,
        sources: Array.isArray(row.sources)
          ? (row.sources as unknown as { document: string; excerpt: string }[])
          : [],
        created_at: row.created_at,
      }));
    },
  });

  const mutation = useMutation({
    mutationFn: async (value: string) =>
      ask({
        data: {
          claimId,
          question: value,
          language,
          notFoundMessage: t("ask.notFound"),
        },
      }),
    onSuccess: async (result) => {
      setQuestion("");
      if (result.inferred) toast.info(t("ask.inferred"));
      await queryClient.invalidateQueries({ queryKey: historyKey });
    },
    onError: () => toast.error(t("ask.failed")),
  });

  function submit() {
    const value = question.trim();
    if (!value) {
      toast.error(t("ask.needsQuestion"));
      return;
    }
    mutation.mutate(value);
  }

  return (
    <section className="surface-card animate-rise p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <MessagesSquare className="size-4.5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("ask.title")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("ask.description")}</p>
        </div>
      </div>

      <div className="space-y-3">
        <Textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={t("ask.placeholder")}
          rows={3}
          disabled={mutation.isPending}
        />
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4 rtl:-scale-x-100" />
            )}
            {t("ask.send")}
          </Button>
          {mutation.isPending ? (
            <span className="text-sm text-muted-foreground">{t("ask.thinking")}</span>
          ) : null}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("ask.history")}
        </h3>
        {isPending ? (
          <Spinner />
        ) : !history || history.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("ask.emptyHistory")}</p>
        ) : (
          <ul className="space-y-3">
            {history.map((row) => (
              <li key={row.id} className="rounded-lg bg-muted/60 p-3">
                <p className="text-sm font-medium text-foreground">{row.question}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {row.answer}
                </p>
                {row.sources.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{t("ask.sources")}</p>
                    {row.sources.map((source, index) => (
                      <p key={`${row.id}-${index}`} className="text-xs text-muted-foreground">
                        {source.document}
                        {source.excerpt ? ` — “${source.excerpt}”` : ""}
                      </p>
                    ))}
                  </div>
                ) : null}
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {new Date(row.created_at).toLocaleString(language)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
