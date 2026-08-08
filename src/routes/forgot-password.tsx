import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/language-provider";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — EasyClaim" },
      {
        name: "description",
        content: "Request a password reset link for your EasyClaim account.",
      },
      { property: "og:title", content: "Reset your EasyClaim password" },
      { property: "og:description", content: "Request a secure password reset link by email." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = z.string().trim().email().max(255).safeParse(form.get("email"));
    if (!email.success) { toast.error(t("auth.invalidEmail")); return; }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-rise">
        <Link
          to="/auth"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" /> {t("auth.backToSignIn")}
        </Link>
        {sent ? (
          <div className="surface-card space-y-3 p-8 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
              <MailCheck className="size-6" />
            </div>
            <h1 className="text-xl font-semibold">{t("forgotPassword.sentTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("forgotPassword.sentText")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="surface-card space-y-4 p-6">
            <div>
              <h1 className="text-xl font-semibold">{t("forgotPassword.title")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("forgotPassword.subtitle")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : t("forgotPassword.submit")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}