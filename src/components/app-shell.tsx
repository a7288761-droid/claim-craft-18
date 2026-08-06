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

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/history", label: "History", icon: History },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Brand() {
  return (
    <Link to="/dashboard" className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground">
        <ShieldCheck className="size-5" />
      </span>
      <span className="truncate text-lg font-semibold tracking-tight text-foreground">
        EasyClaim
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
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
            <span className="truncate">{item.label}</span>
            {item.to === "/notifications" && unread ? (
              <span className="ml-auto grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
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

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="px-1 py-2">
          <Brand />
        </div>
        <div className="mt-6 flex-1">
          <NavLinks />
        </div>
        <Button variant="ghost" className="justify-start gap-3" onClick={signOut}>
          <LogOut className="size-4.5" />
          Log out
        </Button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-4">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="px-1 py-2">
                <Brand />
              </div>
              <div className="mt-6">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
              <Button variant="ghost" className="mt-4 w-full justify-start gap-3" onClick={signOut}>
                <LogOut className="size-4.5" />
                Log out
              </Button>
            </SheetContent>
          </Sheet>
          <Brand />
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
      </div>
    </div>
  );
}