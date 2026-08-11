import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { adminUsers } from "@/lib/admin.functions";
import { RowsSkeleton } from "@/components/loading";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PLAN_IDS } from "@/lib/subscription";
import { useI18n } from "@/i18n/language-provider";

export const Route = createFileRoute("/_authenticated/admin/users/")({
  head: () => ({
    meta: [
      { title: "Admin users — EasyClaim" },
      { name: "description", content: "Search and filter EasyClaim accounts by plan and status." },
      { property: "og:title", content: "EasyClaim admin users" },
      { property: "og:description", content: "Account list with plan, usage and activity." },
    ],
  }),
  component: AdminUsers,
});

const STATUSES = ["active", "pending", "banned"] as const;

function AdminUsers() {
  const { t, language } = useI18n();
  const fetchUsers = useServerFn(adminUsers);
  const { data, isPending } = useQuery({ queryKey: ["admin", "users"], queryFn: () => fetchUsers() });
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((user) => {
      if (plan !== "all" && user.plan !== plan) return false;
      if (status !== "all" && user.accountStatus !== status) return false;
      if (!term) return true;
      return (
        (user.fullName ?? "").toLowerCase().includes(term) ||
        (user.email ?? "").toLowerCase().includes(term)
      );
    });
  }, [data, search, plan, status]);

  const fmt = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(language === "ar" ? "ar" : "en") : "—";

  if (isPending) return <RowsSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("admin.searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <select
          value={plan}
          onChange={(event) => setPlan(event.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          aria-label={t("admin.filterPlan")}
        >
          <option value="all">{t("admin.allPlans")}</option>
          {PLAN_IDS.map((id) => (
            <option key={id} value={id}>
              {t(`plans.${id}.name`)}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          aria-label={t("admin.filterStatus")}
        >
          <option value="all">{t("admin.allStatuses")}</option>
          {STATUSES.map((id) => (
            <option key={id} value={id}>
              {t(`admin.status.${id}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="surface-card overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border text-start text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-start font-medium">{t("common.fullName")}</th>
              <th className="p-3 text-start font-medium">{t("common.email")}</th>
              <th className="p-3 text-start font-medium">{t("admin.plan")}</th>
              <th className="p-3 text-start font-medium">{t("admin.accountStatus")}</th>
              <th className="p-3 text-start font-medium">{t("admin.usage")}</th>
              <th className="p-3 text-start font-medium">{t("admin.createdAt")}</th>
              <th className="p-3 text-start font-medium">{t("admin.lastActivity")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id} className="border-b border-border/60 last:border-0">
                <td className="p-3">
                  <Link
                    to="/admin/users/$userId"
                    params={{ userId: user.id }}
                    className="font-medium text-primary hover:underline"
                  >
                    {user.fullName || t("admin.noName")}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">{user.email ?? "—"}</td>
                <td className="p-3">{t(`plans.${user.plan}.name`, { defaultValue: user.plan })}</td>
                <td className="p-3">
                  <Badge variant={user.accountStatus === "active" ? "secondary" : "outline"}>
                    {t(`admin.status.${user.accountStatus}`)}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground">
                  {user.used.analyses}/{user.limits.analyses} · {user.used.letters}/
                  {user.limits.letters}
                </td>
                <td className="p-3 text-muted-foreground">{fmt(user.createdAt)}</td>
                <td className="p-3 text-muted-foreground">{fmt(user.lastActivity)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  {t("admin.noUsers")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}