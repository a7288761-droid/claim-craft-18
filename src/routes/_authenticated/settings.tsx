import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Moon, Sun, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — EasyClaim" },
      { name: "description", content: "Language, appearance and account settings for EasyClaim." },
      { property: "og:title", content: "EasyClaim settings" },
      { property: "og:description", content: "Control language, theme and your account." },
    ],
  }),
  component: SettingsPage,
});

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
];

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState("en");
  const [deleting, setDeleting] = useState(false);

  async function saveLanguage(next: string) {
    setLanguage(next);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase.from("profiles").update({ language: next }).eq("id", auth.user.id);
    toast.success("Language preference saved");
  }

  async function saveTheme(next: "light" | "dark") {
    setTheme(next);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase.from("profiles").update({ theme: next }).eq("id", auth.user.id);
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user!.id;
      await supabase.from("claims").delete().eq("user_id", userId);
      await supabase.from("notifications").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("id", userId);
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      toast.success("Your data has been deleted and you've been signed out.");
      navigate({ to: "/", replace: true });
    } catch (error) {
      console.error(error);
      toast.error("We couldn't delete your account. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Personalise EasyClaim and manage your account." />

      <section className="surface-card max-w-lg space-y-4 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Preferences
        </h2>
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select value={language} onValueChange={saveLanguage}>
            <SelectTrigger id="language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => saveTheme("light")}
            >
              <Sun className="size-4" /> Light
            </Button>
            <Button
              type="button"
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => saveTheme("dark")}
            >
              <Moon className="size-4" /> Dark
            </Button>
          </div>
        </div>
      </section>

      <section className="surface-card max-w-lg space-y-3 border-destructive/40 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-destructive">
          Danger zone
        </h2>
        <p className="text-sm text-muted-foreground">
          Deleting your account permanently removes your claims, documents, analyses and letters.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. All of your claims, uploaded documents, analyses and letters
                will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteAccount}>Yes, delete everything</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}