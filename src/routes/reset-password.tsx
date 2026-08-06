import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — EasyClaim" },
      { name: "description", content: "Choose a new password for your EasyClaim account." },
      { property: "og:title", content: "Set a new EasyClaim password" },
      { property: "og:description", content: "Complete your password reset securely." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = z.string().min(8).max(72).safeParse(form.get("password"));
    if (!password.success) { toast.error("Password must be at least 8 characters"); return; }
    if (password.data !== form.get("confirm")) { toast.error("Passwords do not match"); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password.data });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <form onSubmit={handleSubmit} className="surface-card w-full max-w-md animate-rise space-y-4 p-6">
        <div>
          <h1 className="text-xl font-semibold">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a password you haven&apos;t used before.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Update password"}
        </Button>
      </form>
    </div>
  );
}