import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileSearch, PenLine, ShieldCheck, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CLAIM_CATEGORIES } from "@/lib/categories";
import heroImage from "@/assets/hero-documents.jpg";
import { useI18n } from "@/i18n/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EasyClaim — Know your rights, draft your claim" },
      {
        name: "description",
        content:
          "Upload insurance policies, contracts, receipts or tickets and get a clear analysis plus a ready-to-send appeal letter draft.",
      },
      { property: "og:title", content: "EasyClaim — Know your rights, draft your claim" },
      {
        property: "og:description",
        content: "Upload insurance policies, contracts, receipts or tickets and get a clear analysis plus a ready-to-send appeal letter draft.",
      },
    ],
  }),
  component: Index,
});

const STEPS = [
  { icon: UploadCloud, titleKey: "landing.step1Title", textKey: "landing.step1Text" },
  { icon: FileSearch, titleKey: "landing.step2Title", textKey: "landing.step2Text" },
  { icon: PenLine, titleKey: "landing.step3Title", textKey: "landing.step3Text" },
] as const;

function Index() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <span className="truncate text-lg font-semibold tracking-tight">{t("common.appName")}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button asChild variant="outline">
            <Link to="/auth">{t("common.signIn")}</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-2 lg:pt-16">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              {t("landing.badge")}
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
              {t("landing.title")}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
              {t("landing.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">
                  {t("landing.cta")} <ArrowRight className="size-4 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
            <p className="mt-6 max-w-md text-xs text-muted-foreground">
              {t("common.disclaimer")}
            </p>
          </div>

          <img
            src={heroImage}
            alt={t("landing.heroAlt")}
            width={1600}
            height={1104}
            className="w-full rounded-3xl shadow-elevated"
          />
        </section>

        <section className="border-y border-border gradient-surface py-16">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">{t("landing.howItWorks")}</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.titleKey} className="surface-card p-6">
                  <div className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                    <step.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{t(step.titleKey)}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{t(step.textKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">{t("landing.whereWeHelp")}</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CLAIM_CATEGORIES.map((category) => (
              <div key={category.slug} className="surface-card flex items-center gap-3 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <category.icon className="size-5" />
                </span>
                <span className="truncate text-sm font-medium">
                  {t(`categories.${category.slug}.name`, { defaultValue: category.name })}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto w-full max-w-6xl px-4 text-xs text-muted-foreground sm:px-6">
          {t("landing.footer", { year: new Date().getFullYear() })}
        </div>
      </footer>
    </div>
  );
}
