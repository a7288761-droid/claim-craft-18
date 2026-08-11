import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { BarChart3, CreditCard, ShieldAlert, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RowsSkeleton } from "@/components/loading";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/language-provider";
import { useIsAdmin } from "@/lib/use-admin";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", key: "admin.tabOverview", icon: BarChart3 },
  { to: "/admin/users", key: "admin.tabUsers", icon: Users },
  { to: "/admin/plans", key: "admin.tabPlans", icon: CreditCard },
] as const;

function AdminLayout() {
  const { t } = useI18n();
  const { isAdmin, isPending } = useIsAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (isPending) return <RowsSkeleton />;

  if (!isAdmin) {
    return (
      <div className="surface-card mx-auto max-w-lg space-y-2 p-8 text-center">
        <ShieldAlert className="mx-auto size-8 text-destructive" />
        <h1 className="text-lg font-semibold text-foreground">{t("admin.deniedTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.deniedBody")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.title")} description={t("admin.description")} />
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = tab.to === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="size-4" />
              {t(tab.key)}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}