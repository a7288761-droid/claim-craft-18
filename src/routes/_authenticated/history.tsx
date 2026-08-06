import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileClock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { RowsSkeleton } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCategory } from "@/lib/categories";

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
      <PageHeader title="History" description="Every claim you have started, newest first." />

      {isPending ? (
        <RowsSkeleton />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={FileClock}
          title="No analyses yet"
          description="Once you upload documents in a workspace, your analyses will appear here."
          action={
            <Button asChild>
              <Link to="/dashboard">Start a claim</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {data.map((claim, index) => {
            const category = getCategory(claim.category);
            const Icon = category?.icon ?? FileClock;
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
                    <p className="truncate text-sm font-semibold text-foreground">{claim.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(claim.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
                    {claim.status}
                  </Badge>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}