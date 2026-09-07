import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyAccount } from "@/lib/account.functions";
import { Moon, Sun, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { UsageMeter } from "@/components/usage-meter";
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
import { useI18n } from "@/i18n/language-provider";
import { SUPPORTED_LANGUAGES } from "@/i18n/config";
import type { LanguageCode } from "@/i18n/config";

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

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const runDeleteAccount = useServerFn(deleteMyAccount);

  function saveLanguage(next: string) {
    setLanguage(next as LanguageCode);
    toast.success(t("settings.languageSaved"));
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
      await runDeleteAccount({});
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      toast.success(t("settings.deleted"));
      navigate({ to: "/", replace: true });
    } catch (error) {
      console.error(error);
      toast.error(t("settings.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title={t("settings.title")} description={t("settings.description")} />

      <UsageMeter />

      <section className="surface-card max-w-lg space-y-4 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("settings.preferences")}
        </h2>
        <div className="space-y-2">
          <Label htmlFor="language">{t("common.language")}</Label>
          <Select value={language} onValueChange={saveLanguage}>
            <SelectTrigger id="language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("common.theme")}</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => saveTheme("light")}
            >
              <Sun className="size-4" /> {t("common.light")}
            </Button>
            <Button
              type="button"
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => saveTheme("dark")}
            >
              <Moon className="size-4" /> {t("common.dark")}
            </Button>
          </div>
        </div>
      </section>

      <section className="surface-card max-w-lg space-y-3 border-destructive/40 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-destructive">
          {t("settings.dangerZone")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("settings.dangerText")}</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {t("settings.deleteAccount")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("settings.deleteTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("settings.deleteDescription")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={deleteAccount}>{t("settings.deleteConfirm")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}