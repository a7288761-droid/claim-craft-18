import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileClock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { RowsSkeleton } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { ClaimStatusBadge } from "@/components/claim-status-badge";
import { daysUntil } from "@/lib/claim-status";
import { getCategory } from "@/lib/categories";
import { useI18n } from "@/i18n/language-provider";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Claim history — EasyClaim" },
      { name: "description", content: "Review every claim you have analysed with EasyClaim." },
      { property: "og:title", content: "Your EasyClaim history" },
      { property: "og:description", content: "All your previous document analyses in one list." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { t, language } = useI18n();
  const { data, isPending } = useQuery({
    queryKey: ["claims-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("claims")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader title={t("history.title")} description={t("history.description")} />

      {isPending ? (
        <RowsSkeleton />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={FileClock}
          title={t("history.emptyTitle")}
          description={t("history.emptyText")}
          action={
            <Button asChild>
              <Link to="/dashboard">{t("history.startClaim")}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {data.map((claim, index) => {
            const category = getCategory(claim.category);
            const Icon = category?.icon ?? FileClock;
            const categoryName = category
              ? t(`categories.${category.slug}.name`, { defaultValue: category.name })
              : claim.category;
            return (
              <li key={claim.id} style={{ animationDelay: `${index * 30}ms` }} className="animate-rise">
                <Link
                  to="/analysis/$claimId"
                  params={{ claimId: claim.id }}
                  className="surface-card group flex items-center gap-4 p-4 hover:shadow-elevated"
                >
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {t("workspace.claimTitle", { category: categoryName })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("claimStatus.lastUpdated", {
                        date: new Date(
                          claim.status_updated_at ?? claim.updated_at ?? claim.created_at,
                        ).toLocaleString(language),
                      })}
                    </p>
                    {claim.deadline_at ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {(() => {
                          const left = daysUntil(claim.deadline_at);
                          if (left === null) return null;
                          return left < 0 ? t("deadline.passed") : t("deadline.daysLeft", { count: left });
                        })()}
                      </p>
                    ) : null}
                  </div>
                  <ClaimStatusBadge status={claim.status} className="hidden shrink-0 sm:inline-flex" />
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}