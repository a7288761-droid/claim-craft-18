import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = z.string().trim().email().max(255).safeParse(form.get("email"));
    if (!email.success) return toast.error("Enter a valid email address");

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-rise">
        <Link
          to="/auth"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
        {sent ? (
          <div className="surface-card space-y-3 p-8 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
              <MailCheck className="size-6" />
            </div>
            <h1 className="text-xl font-semibold">Reset link sent</h1>
            <p className="text-sm text-muted-foreground">
              If an account exists for that address, you will receive an email with a link to set a
              new password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="surface-card space-y-4 p-6">
            <div>
              <h1 className="text-xl font-semibold">Forgot your password?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Send reset link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}