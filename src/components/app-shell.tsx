import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  History,
  Bell,
  Settings,
  UserRound,
  LogOut,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

const NAV = [
  { to: "/dashboard", key: "nav.dashboard", icon: LayoutGrid },
  { to: "/history", key: "nav.history", icon: History },
  { to: "/notifications", key: "nav.notifications", icon: Bell },
  { to: "/profile", key: "nav.profile", icon: UserRound },
  { to: "/settings", key: "nav.settings", icon: Settings },
] as const;

function Brand() {
  const { t } = useI18n();
  return (
    <Link to="/dashboard" className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground">
        <ShieldCheck className="size-5" />
      </span>
      <span className="truncate text-lg font-semibold tracking-tight text-foreground">
        {t("common.appName")}
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: unread } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("read", false);
      return count ?? 0;
    },
  });

  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4.5 shrink-0" />
            <span className="truncate">{t(item.key)}</span>
            {item.to === "/notifications" && unread ? (
              <span className="ms-auto grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, dir } = useI18n();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 start-0 hidden w-64 flex-col border-e border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="px-1 py-2">
          <Brand />
        </div>
        <div className="mt-6 flex-1">
          <NavLinks />
        </div>
        <div className="mb-2 px-1">
          <LanguageSwitcher className="w-full justify-start" />
        </div>
        <Button variant="ghost" className="justify-start gap-3" onClick={signOut}>
          <LogOut className="size-4.5" />
          {t("common.logOut")}
        </Button>
      </aside>

      <div className="lg:ps-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("common.openMenu")}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={dir === "rtl" ? "right" : "left"} className="w-72 bg-sidebar p-4">
              <SheetTitle className="sr-only">{t("common.navigation")}</SheetTitle>
              <div className="px-1 py-2">
                <Brand />
              </div>
              <div className="mt-6">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
              <div className="mt-4">
                <LanguageSwitcher className="w-full justify-start" />
              </div>
              <Button variant="ghost" className="mt-4 w-full justify-start gap-3" onClick={signOut}>
                <LogOut className="size-4.5" />
                {t("common.logOut")}
              </Button>
            </SheetContent>
          </Sheet>
          <Brand />
          <div className="ms-auto">
            <LanguageSwitcher variant="ghost" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
      </div>
    </div>
  );
}