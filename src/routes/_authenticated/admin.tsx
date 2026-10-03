import { createFileRoute, redirect } from "@tanstack/react-router";
import { CreditCard, ShieldCheck, Users, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { AdminDeposits } from "@/components/AdminDeposits";
import { AdminWithdrawals } from "@/components/AdminWithdrawals";
import { AdminDepositAccount, AdminPlans } from "@/components/AdminSettings";

export const Route = createFileRoute("/_authenticated/admin")({
  // Authorization is decided by the database, never by client-side constants.
  beforeLoad: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw redirect({ to: "/login" });

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (error || (data as { role?: string } | null)?.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Admin Control Panel — DollarCash" },
      { name: "description", content: "Secure DollarCash admin control panel." },
      { property: "og:title", content: "Admin Control Panel — DollarCash" },
      { property: "og:description", content: "Manage users, deposits, withdrawals and payment methods." },
    ],
  }),
  component: AdminPage,
});

const PANELS = [
  { label: "Users", description: "Search accounts, review balances and ban status.", icon: Users },
  { label: "Payment Methods", description: "Configure the channels users can pay with.", icon: CreditCard },
];

function AdminPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="animate-rise">
          <div className="flex items-center gap-2 text-gold">
            <ShieldCheck className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Admin access</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Control Panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access is verified on the server for every visit.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="size-4 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">Deposits</h2>
          </div>
          <AdminDeposits />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ArrowUpFromLine className="size-4 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">Withdrawals</h2>
          </div>
          <AdminWithdrawals />
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Deposit Account</h2>
          <AdminDepositAccount />
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Investment Plans</h2>
          <AdminPlans />
        </div>

        <div className="stagger grid gap-3 sm:grid-cols-2">
          {PANELS.map(({ label, description, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-border/70 surface-gradient p-5 glow-ring">
              <Icon className="size-5 text-primary" />
              <p className="mt-3 font-display text-lg font-semibold text-foreground">{label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest gold-text">Coming Soon</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
