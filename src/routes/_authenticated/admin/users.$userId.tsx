import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
import { adminUserDetail } from "@/lib/admin.functions";
import { RowsSkeleton } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { ClaimStatusBadge } from "@/components/claim-status-badge";
import { getCategory } from "@/lib/categories";
import { useI18n } from "@/i18n/language-provider";

export const Route = createFileRoute("/_authenticated/admin/users/$userId")({
  head: () => ({
    meta: [
      { title: "Admin user details — EasyClaim" },
      { name: "description", content: "Account plan, usage and claim activity for one EasyClaim user." },
      { property: "og:title", content: "EasyClaim admin user details" },
      { property: "og:description", content: "Plan, quota usage and claim statuses for one account." },
    ],
  }),
  component: AdminUserDetail,
});

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function AdminUserDetail() {
  const { t, language } = useI18n();
  const { userId } = useParams({ from: "/_authenticated/admin/users/$userId" });
  const fetchDetail = useServerFn(adminUserDetail);
  const { data, isPending } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => fetchDetail({ data: { userId } }),
  });

  if (isPending) return <RowsSkeleton />;
  if (!data) return <p className="text-sm text-muted-foreground">{t("admin.noUsers")}</p>;

  const { user } = data;
  const fmt = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(language === "ar" ? "ar" : "en") : "—";

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/admin/users" className="flex items-center gap-2">
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t("admin.backToUsers")}
        </Link>
      </Button>

      <section className="surface-card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={t("common.fullName")} value={user.fullName || t("admin.noName")} />
        <Field label={t("common.email")} value={user.email ?? "—"} />
        <Field label={t("admin.plan")} value={t(`plans.${user.plan}.name`, { defaultValue: user.plan })} />
        <Field label={t("admin.accountStatus")} value={t(`admin.status.${user.accountStatus}`)} />
        <Field label={t("admin.createdAt")} value={fmt(user.createdAt)} />
        <Field label={t("admin.lastActivity")} value={fmt(user.lastActivity)} />
        <Field
          label={t("plans.analyses")}
          value={`${user.used.analyses} / ${user.limits.analyses} · ${t("admin.remaining")}: ${Math.max(0, user.limits.analyses - user.used.analyses)}`}
        />
        <Field
          label={t("plans.letters")}
          value={`${user.used.letters} / ${user.limits.letters} · ${t("admin.remaining")}: ${Math.max(0, user.limits.letters - user.used.letters)}`}
        />
        <Field label={t("admin.totalClaims")} value={user.claims} />
      </section>

      <section className="surface-card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-foreground">{t("admin.claimsByStatus")}</h2>
        <ul className="space-y-2 text-sm">
          {Object.entries(data.statusCounts).map(([status, count]) => (
            <li key={status} className="flex items-center justify-between">
              <span className="text-muted-foreground">{t(`claimStatus.${status}`)}</span>
              <span className="font-medium text-foreground">{count}</span>
            </li>
          ))}
          {Object.keys(data.statusCounts).length === 0 ? (
            <li className="text-muted-foreground">{t("admin.noClaims")}</li>
          ) : null}
        </ul>
      </section>

      <section className="surface-card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-foreground">{t("admin.recentClaims")}</h2>
        <p className="text-xs text-muted-foreground">{t("admin.privacyNote")}</p>
        <ul className="divide-y divide-border/60">
          {data.claims.map((claim) => (
            <li key={claim.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{claim.title}</p>
                <p className="text-xs text-muted-foreground">
                  {t(`categories.${claim.category}.name`, {
                    defaultValue: getCategory(claim.category)?.name ?? claim.category,
                  })}{" "}
                  · {fmt(claim.created_at)}
                </p>
              </div>
              <ClaimStatusBadge status={claim.status} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}