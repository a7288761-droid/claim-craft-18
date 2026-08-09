import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  ArrowRight,
  FileStack,
  FileCheck2,
  Clock3,
  CircleAlert,
  CircleCheckBig,
} from "lucide-react";
import { CLAIM_CATEGORIES } from "@/lib/categories";
import { PageHeader } from "@/components/page-header";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeStatus, STATUS_BUCKETS } from "@/lib/claim-status";
import { runDeadlineReminders } from "@/lib/claim-notifications";
import { useI18n } from "@/i18n/language-provider";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — EasyClaim" },
      {
        name: "description",
        content: "Choose a claim category and start analysing your documents with EasyClaim.",
      },
      { property: "og:title", content: "EasyClaim Dashboard" },
      { property: "og:description", content: "Your claim workspaces in one place." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useI18n();
  const { data: stats, isPending } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: claims } = await supabase.from("claims").select("id, status");
      const rows = claims ?? [];
      const count = (bucket: readonly string[]) =>
        rows.filter((row) => bucket.includes(normalizeStatus(row.status))).length;
      return {
        claims: rows.length,
        needsAction: count(STATUS_BUCKETS.needsAction),
        waiting: count(STATUS_BUCKETS.waiting),
        ready: count(STATUS_BUCKETS.readyToAppeal),
        closed: count(STATUS_BUCKETS.closed),
      };
    },
  });

  useEffect(() => {
    void runDeadlineReminders((key, options) =>
      options ? String(t(key, options as never)) : String(t(key)),
    );
  }, [t]);

  const cards = [
    { label: t("dashboard.claimsStarted"), value: stats?.claims, icon: FileStack },
    { label: t("dashboard.needsAction"), value: stats?.needsAction, icon: CircleAlert },
    { label: t("dashboard.waiting"), value: stats?.waiting, icon: Clock3 },
    { label: t("dashboard.readyToAppeal"), value: stats?.ready, icon: FileCheck2 },
    { label: t("dashboard.closed"), value: stats?.closed, icon: CircleCheckBig },
  ];

  return (
    <div className="space-y-10">
      <PageHeader title={t("dashboard.title")} description={t("dashboard.description")} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="surface-card flex items-center gap-4 p-5">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <card.icon className="size-5" />
            </div>
            <div className="min-w-0">
              {isPending ? (
                <Skeleton className="h-7 w-10" />
              ) : (
                <p className="text-2xl font-semibold text-foreground">{card.value}</p>
              )}
              <p className="truncate text-xs text-muted-foreground">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CLAIM_CATEGORIES.map((category, index) => (
          <Link
            key={category.slug}
            to="/workspace/$category"
            params={{ category: category.slug }}
            style={{ animationDelay: `${index * 40}ms` }}
            className="surface-card group animate-rise p-5 hover:-translate-y-1 hover:shadow-elevated"
          >
            <div className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:gradient-primary group-hover:text-primary-foreground">
              <category.icon className="size-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">
              {t(`categories.${category.slug}.name`, { defaultValue: category.name })}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(`categories.${category.slug}.description`, { defaultValue: category.description })}
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              {t("dashboard.openWorkspace")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}