import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Layers, Receipt, TrendingUp, Users, Wallet } from "lucide-react";
import { toast } from "sonner";

import { useProfile } from "@/hooks/useProfile";
import { useEarningsSummary } from "@/hooks/useEarnings";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — DollarCash" },
      { name: "description", content: "Your DollarCash balance, plans, earnings and referrals at a glance." },
      { property: "og:title", content: "Dashboard — DollarCash" },
      { property: "og:description", content: "Track balance, earnings and referrals in one place." },
    ],
  }),
  component: DashboardHome,
});

const money = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function DashboardHome() {
  const { data: profile, isLoading } = useProfile();

  const stats = [
    { label: "Active Plans", value: "0", icon: Layers },
    { label: "Total Earnings", value: money(0), icon: TrendingUp },
    { label: "Referrals", value: "0", icon: Users },
    { label: "Pending Transactions", value: "0", icon: Receipt },
  ];

  function copyCode() {
    if (!profile?.referral_code) return;
    void navigator.clipboard.writeText(profile.referral_code);
    toast.success("Referral code copied");
  }

  return (
    <div className="space-y-6">
      <div className="animate-rise">
        <p className="text-sm text-muted-foreground">Welcome back</p>
        {isLoading ? (
          <Skeleton className="mt-1 h-8 w-48" />
        ) : (
          <h1 className="text-2xl font-semibold text-foreground">
            {profile?.full_name || "DollarCash member"}
          </h1>
        )}
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-border/70 brand-gradient p-6 glow-ring animate-fade">
        <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-gold/25 blur-3xl animate-float" />
        <div className="relative">
          <div className="flex items-center gap-2 text-primary-foreground/80">
            <Wallet className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Main Balance</span>
          </div>
          <p className="mt-3 font-display text-4xl font-semibold text-primary-foreground">
            {money(Number(profile?.balance ?? 0))}
          </p>
          <div className="mt-5 flex gap-2">
            <Button asChild variant="secondary" className="tap rounded-xl">
              <Link to="/dashboard/deposit">Deposit</Link>
            </Button>
            <Button asChild variant="outline" className="tap rounded-xl bg-transparent text-primary-foreground">
              <Link to="/dashboard/withdraw">Withdraw</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="stagger grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border/70 bg-card p-4">
            <Icon className="size-4 text-primary" />
            <p className="mt-3 font-display text-xl font-semibold text-foreground">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border/70 surface-gradient p-5 animate-fade">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Your referral code
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          {isLoading ? (
            <Skeleton className="h-7 w-32" />
          ) : (
            <span className="font-display text-2xl font-semibold gold-text">
              {profile?.referral_code ?? "—"}
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={copyCode} className="tap rounded-full" aria-label="Copy referral code">
            <Copy className="size-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
