import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { UsageMeter } from "@/components/usage-meter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/language-provider";
import { PLAN_IDS, subscriptionQueryKey, useSubscription, type PlanId } from "@/lib/subscription";

export const Route = createFileRoute("/_authenticated/plans")({
  head: () => ({
    meta: [
      { title: "Plans & pricing — EasyClaim" },
      {
        name: "description",
        content: "Compare the EasyClaim Free, Basic and Pro plans and see your monthly usage.",
      },
      { property: "og:title", content: "EasyClaim plans & pricing" },
      { property: "og:description", content: "Free, Basic and Pro claim analysis plans." },
    ],
  }),
  component: PlansPage,
});

const FEATURES: Record<PlanId, string[]> = {
  free: ["featureUploads", "featureBasicAnalysis", "featureTracking", "featureNotifications"],
  basic: ["featureAdvancedAnalysis", "featureExports", "featureAllFree"],
  pro: ["featureAdvancedAnalysis", "featureExtendedAi", "featureExports", "featureAllBasic"],
};

function PlanCard({
  plan,
  current,
  onSelect,
  busy,
}: {
  plan: PlanId;
  current: boolean;
  onSelect: () => void;
  busy: boolean;
}) {
  const { t } = useI18n();
  const { data } = useSubscription();
  const limits = current ? data?.limits : undefined;
  const highlight = plan === "basic";

  return (
    <div
      className={cn(
        "surface-card flex flex-col gap-5 p-6",
        highlight && "ring-2 ring-primary",
        current && "border-primary",
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">{t(`plans.${plan}.name`)}</h2>
          {current ? <Badge>{t("plans.currentBadge")}</Badge> : null}
          {highlight && !current ? (
            <Badge variant="secondary">{t("plans.popular")}</Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{t(`plans.${plan}.tagline`)}</p>
      </div>

      <ul className="space-y-2.5 text-sm">
        <li className="flex items-start gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
          {t("plans.featureAnalyses", { count: PLAN_LIMITS[plan].analyses })}
        </li>
        <li className="flex items-start gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
          {t("plans.featureLetters", { count: PLAN_LIMITS[plan].letters })}
        </li>
        {FEATURES[plan].map((key) => (
          <li key={key} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            {t(`plans.${key}`)}
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        {limits ? null : null}
        <Button
          className="w-full"
          variant={current ? "outline" : "default"}
          disabled={current || busy}
          onClick={onSelect}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {current ? t("plans.currentPlanButton") : t("plans.activate")}
        </Button>
      </div>
    </div>
  );
}

/** Display-only mirror of the limits stored in the database plans table. */
const PLAN_LIMITS: Record<PlanId, { analyses: number; letters: number }> = {
  free: { analyses: 3, letters: 2 },
  basic: { analyses: 15, letters: 10 },
  pro: { analyses: 60, letters: 40 },
};

function PlansPage() {
  const { t } = useI18n();
  const { data } = useSubscription();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<PlanId | null>(null);

  async function selectPlan(plan: PlanId) {
    setPending(plan);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("no user");
      const { error } = await supabase
        .from("subscriptions")
        .upsert({ user_id: auth.user.id, plan }, { onConflict: "user_id" });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: subscriptionQueryKey });
      toast.success(t("plans.activated", { plan: t(`plans.${plan}.name`) }));
    } catch (error) {
      console.error(error);
      toast.error(t("plans.activateFailed"));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title={t("plans.title")} description={t("plans.description")} />

      <UsageMeter compact />

      <div className="grid gap-5 lg:grid-cols-3">
        {PLAN_IDS.map((plan) => (
          <PlanCard
            key={plan}
            plan={plan}
            current={data?.plan === plan}
            busy={pending === plan}
            onSelect={() => void selectPlan(plan)}
          />
        ))}
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Sparkles className="mt-0.5 size-3.5 shrink-0" />
        {t("plans.noPayment")}
      </p>
    </div>
  );
}
