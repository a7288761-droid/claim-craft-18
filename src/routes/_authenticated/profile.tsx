import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — EasyClaim" },
      { name: "description", content: "Manage your EasyClaim account details." },
      { property: "og:title", content: "Your EasyClaim profile" },
      { property: "og:description", content: "Update your name and account information." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user!.id)
        .maybeSingle();
      return { user: auth.user!, profile };
    },
  });

  useEffect(() => {
    if (data?.profile?.full_name) setFullName(data.profile.full_name);
  }, [data?.profile?.full_name]);

  if (isPending) return <Spinner />;

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const parsed = z.string().trim().min(2).max(100).safeParse(fullName);
    if (!parsed.success) {
      toast.error("Enter a name between 2 and 100 characters");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: parsed.data })
      .eq("id", data!.user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile updated");
  }

  const initials = (fullName || data?.user.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-8">
      <PageHeader title="Profile" description="Your personal details used in generated letters." />

      <div className="surface-card flex items-center gap-4 p-6">
        <div className="grid size-16 shrink-0 place-items-center rounded-2xl gradient-primary text-xl font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">
            {fullName || "Unnamed user"}
          </p>
          <p className="truncate text-sm text-muted-foreground">{data?.user.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="surface-card max-w-lg space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="full-name">Full name</Label>
          <Input
            id="full-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={data?.user.email ?? ""} disabled />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <UserRound className="size-4" />}
          Save changes
        </Button>
      </form>
    </div>
  );
}