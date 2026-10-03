import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckSquare,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/plans", label: "Investment Plans", icon: TrendingUp },
  { to: "/dashboard/tasks", label: "Daily Tasks", icon: CheckSquare },
  { to: "/dashboard/deposit", label: "Deposit", icon: ArrowDownToLine },
  { to: "/dashboard/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { to: "/dashboard/referrals", label: "Referrals", icon: Users },
  { to: "/dashboard/transactions", label: "Transactions", icon: ListOrdered },
  { to: "/dashboard/budget", label: "Budget Planner", icon: Sparkles },
  { to: "/dashboard/profile", label: "Profile", icon: UserRound },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useProfile();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={`tap flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
      {profile?.role === "admin" && (
        <Link
          to="/admin"
          onClick={() => setOpen(false)}
          className="tap mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gold hover:bg-gold/10"
        >
          <ShieldCheck className="size-4" />
          Admin Panel
        </Link>
      )}
      <button
        onClick={signOut}
        className="tap mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
      >
        <LogOut className="size-4" />
        Logout
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-lg">
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="tap rounded-full lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-5">
              <SheetTitle className="mb-5">
                <BrandMark />
              </SheetTitle>
              {nav}
            </SheetContent>
          </Sheet>
          <BrandMark />
        </div>
        <ThemeToggle />
      </header>

      <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 py-6 lg:px-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-border/70 bg-card/60 p-3">{nav}</div>
        </aside>
        <main className="min-w-0 flex-1 pb-14">{children}</main>
      </div>
    </div>
  );
}
