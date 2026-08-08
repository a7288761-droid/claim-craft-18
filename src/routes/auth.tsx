import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/i18n/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create an account — EasyClaim" },
      {
        name: "description",
        content:
          "Log in to EasyClaim or create a free account to analyse your documents and prepare claim letters.",
      },
      { property: "og:title", content: "Sign in to EasyClaim" },
      {
        property: "og:description",
        content: "Access your claims workspace, document analysis and appeal letters.",
      },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("invalidEmail").max(255);
const passwordSchema = z.string().min(8, "invalidPassword").max(72);
const nameSchema = z.string().trim().min(2, "invalidName").max(100);

function AuthPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);

  const fieldError = (key: string) => toast.error(t(`auth.${key}`));

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = emailSchema.safeParse(form.get("email"));
    const password = passwordSchema.safeParse(form.get("password"));
    if (!email.success) { fieldError(email.error.issues[0]!.message); return; }
    if (!password.success) { fieldError(password.error.issues[0]!.message); return; }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.data,
      password: password.data,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/dashboard" });
  }

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = nameSchema.safeParse(form.get("name"));
    const email = emailSchema.safeParse(form.get("email"));
    const password = passwordSchema.safeParse(form.get("password"));
    if (!name.success) { fieldError(name.error.issues[0]!.message); return; }
    if (!email.success) { fieldError(email.error.issues[0]!.message); return; }
    if (!password.success) { fieldError(password.error.issues[0]!.message); return; }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.data,
      password: password.data,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name.data },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (!data.session) {
      setPendingConfirm(true);
      return;
    }
    navigate({ to: "/dashboard" });
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      { toast.error(t("auth.googleFailed")); return; }
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between gradient-primary p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2.5 text-lg font-semibold">
          <ShieldCheck className="size-6" />
          {t("common.appName")}
        </Link>
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">
            {t("auth.sideTitleLine1")}
            <br />
            {t("auth.sideTitleLine2")}
          </h2>
          <p className="max-w-sm text-sm opacity-90">
            {t("auth.sideText")}
          </p>
        </div>
        <p className="text-xs opacity-75">{t("auth.sideDisclaimer")}</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-rise">
          <div className="mb-8 flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl gradient-primary text-primary-foreground">
                <ShieldCheck className="size-5" />
              </span>
              <span className="text-lg font-semibold lg:hidden">{t("common.appName")}</span>
            </Link>
            <LanguageSwitcher />
          </div>

          {pendingConfirm ? (
            <div className="surface-card space-y-3 p-8 text-center">
              <h1 className="text-xl font-semibold">{t("auth.checkInbox")}</h1>
              <p className="text-sm text-muted-foreground">{t("auth.checkInboxText")}</p>
              <Button variant="outline" onClick={() => setPendingConfirm(false)}>
                {t("auth.backToSignIn")}
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t("common.logIn")}</TabsTrigger>
                <TabsTrigger value="signup">{t("common.signUp")}</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="surface-card space-y-4 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t("common.email")}</Label>
                    <Input id="login-email" name="email" type="email" autoComplete="email" required />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">{t("common.password")}</Label>
                      <Link
                        to="/forgot-password"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {t("auth.forgotPassword")}
                      </Link>
                    </div>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : t("common.logIn")}
                  </Button>
                  <GoogleButton onClick={handleGoogle} disabled={loading} />
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignUp} className="surface-card space-y-4 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{t("common.fullName")}</Label>
                    <Input id="signup-name" name="name" autoComplete="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t("common.email")}</Label>
                    <Input id="signup-email" name="email" type="email" autoComplete="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t("common.password")}</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                    />
                    <p className="text-xs text-muted-foreground">{t("auth.passwordHint")}</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : t("common.createAccount")}
                  </Button>
                  <GoogleButton onClick={handleGoogle} disabled={loading} />
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  const { t } = useI18n();
  return (
    <>
      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{t("common.or")}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={onClick} disabled={disabled}>
        <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" />
          <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
          <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.7l4-3Z" />
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
        </svg>
        {t("auth.continueWithGoogle")}
      </Button>
    </>
  );
}