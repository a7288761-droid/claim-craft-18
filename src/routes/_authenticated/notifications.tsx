import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellOff, CheckCheck, Info, CircleCheck, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { RowsSkeleton } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/language-provider";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — EasyClaim" },
      { name: "description", content: "Updates about your analyses, letters and deadlines." },
      { property: "og:title", content: "EasyClaim notifications" },
      { property: "og:description", content: "Stay on top of your claim activity." },
    ],
  }),
  component: NotificationsPage,
});

const ICONS = { success: CircleCheck, warning: TriangleAlert, info: Info } as const;

function NotificationsPage() {
  const queryClient = useQueryClient();
  const { t, language } = useI18n();

  const { data, isPending } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unread = data?.filter((item) => !item.read).length ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("notifications.title")}
        description={unread ? t("notifications.unread", { count: unread }) : t("notifications.caughtUp")}
        action={
          unread ? (
            <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              <CheckCheck className="size-4" /> {t("notifications.markAll")}
            </Button>
          ) : null
        }
      />

      {isPending ? (
        <RowsSkeleton count={3} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={t("notifications.emptyTitle")}
          description={t("notifications.emptyText")}
        />
      ) : (
        <ul className="space-y-3">
          {data.map((item, index) => {
            const Icon = ICONS[(item.type as keyof typeof ICONS) in ICONS ? (item.type as keyof typeof ICONS) : "info"];
            return (
              <li
                key={item.id}
                style={{ animationDelay: `${index * 30}ms` }}
                className={cn(
                  "surface-card animate-rise flex gap-4 p-4",
                  !item.read && "border-primary/40 bg-primary-soft/40",
                )}
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{item.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString(language)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}