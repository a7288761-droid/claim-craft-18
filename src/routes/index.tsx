import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileSearch, PenLine, ShieldCheck, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CLAIM_CATEGORIES } from "@/lib/categories";
import heroImage from "@/assets/hero-documents.jpg";

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
  {
    icon: UploadCloud,
    title: "Upload your documents",
    text: "Add policies, contracts, receipts, tickets or rejection letters as images or PDFs.",
  },
  {
    icon: FileSearch,
    title: "See what matters",
    text: "Get a summary, key clauses, rejection risks, deadlines and the amounts in dispute.",
  },
  {
    icon: PenLine,
    title: "Send a strong appeal",
    text: "Generate a professional appeal letter you can copy, download or print in one click.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <span className="truncate text-lg font-semibold tracking-tight">EasyClaim</span>
        </div>
        <Button asChild variant="outline">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-2 lg:pt-16">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              AI-assisted claim preparation
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
              Understand your rights and prepare your claim in minutes
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
              EasyClaim reads your insurance policies, contracts, receipts and tickets, explains
              what they actually say, and drafts the appeal letter for you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">
                  Get started free <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <p className="mt-6 max-w-md text-xs text-muted-foreground">
              EasyClaim provides general information only. It is not legal advice and does not
              guarantee any compensation.
            </p>
          </div>

          <img
            src={heroImage}
            alt="Desk with a laptop, insurance policy, receipt and airline ticket ready for a claim"
            width={1600}
            height={1104}
            className="w-full rounded-3xl shadow-elevated"
          />
        </section>

        <section className="border-y border-border gradient-surface py-16">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.title} className="surface-card p-6">
                  <div className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                    <step.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Where EasyClaim helps</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CLAIM_CATEGORIES.map((category) => (
              <div key={category.slug} className="surface-card flex items-center gap-3 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <category.icon className="size-5" />
                </span>
                <span className="truncate text-sm font-medium">{category.name}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto w-full max-w-6xl px-4 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} EasyClaim. Informational tool only — not a law firm.
        </div>
      </footer>
    </div>
  );
}
