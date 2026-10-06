import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, CheckSquare, Gift, TrendingUp, Wallet } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard/history")({
  head: () => ({
    meta: [
      { title: "Balance History — DollarCash" },
      { name: "description", content: "See every deposit, withdrawal, daily return and check-in on your balance." },
      { property: "og:title", content: "Balance History — DollarCash" },
      { property: "og:description", content: "Understand exactly where your DollarCash balance comes from." },
    ],
  }),
  component: BalanceHistory,
});

type Entry = {
  id: string;
  kind: "deposit" | "withdrawal" | "profit" | "task" | "referral" | "plan";
  label: string;
  note?: string;
  amount: number; // signed effect on balance
  at: string;
};

function useBalanceHistory() {
  return useQuery({
    queryKey: ["balance-history"],
    queryFn: async (): Promise<Entry[]> => {
      // Row-level security limits every read to the signed-in member's own rows.
      const [dep, wd, pp, tc, rr, inv] = await Promise.all([
        supabase.from("deposits").select("id, method, amount_usd, status, created_at, reviewed_at").eq("status", "APPROVED"),
        supabase.from("withdrawals").select("id, method, amount_usd, status, created_at").neq("status", "REJECTED"),
        supabase.from("profit_payments").select("id, plan_name, amount, created_at"),
        supabase.from("task_completions").select("id, reward, created_at"),
        supabase.from("referral_rewards").select("id, milestone, reward_amount, created_at"),
        supabase.from("user_investments").select("id, plan_name, amount_invested, activated_at"),
      ]);
      for (const r of [dep, wd, pp, tc, rr, inv]) if (r.error) throw r.error;
      const out: Entry[] = [
        ...(dep.data ?? []).map((d) => ({ id: "d" + d.id, kind: "deposit" as const, label: `Deposit — ${d.method}`, amount: Number(d.amount_usd), at: d.reviewed_at ?? d.created_at })),
        ...(wd.data ?? []).map((w) => ({ id: "w" + w.id, kind: "withdrawal" as const, label: `Withdrawal — ${w.method}`, note: w.status === "PENDING" ? "Pending" : undefined, amount: -Number(w.amount_usd), at: w.created_at })),
        ...(pp.data ?? []).map((p) => ({ id: "p" + p.id, kind: "profit" as const, label: `Daily return — ${p.plan_name}`, amount: Number(p.amount), at: p.created_at })),
        ...(tc.data ?? []).map((t) => ({ id: "t" + t.id, kind: "task" as const, label: "Daily check-in", amount: Number(t.reward), at: t.created_at })),
        ...(rr.data ?? []).map((r) => ({ id: "r" + r.id, kind: "referral" as const, label: `Referral reward — ${r.milestone} invites`, amount: Number(r.reward_amount), at: r.created_at })),
        ...(inv.data ?? []).map((i) => ({ id: "i" + i.id, kind: "plan" as const, label: `Plan purchase — ${i.plan_name}`, amount: -Number(i.amount_invested), at: i.activated_at })),
      ];
      return out.sort((a, b) => +new Date(b.at) - +new Date(a.at));
    },
  });
}

const ICONS = { deposit: ArrowDownToLine, withdrawal: ArrowUpFromLine, profit: TrendingUp, task: CheckSquare, referral: Gift, plan: Wallet };

const money = (v: number) => `$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const stamp = (v: string) =>
  new Date(v).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function BalanceHistory() {
  const { data, isLoading, error } = useBalanceHistory();
  const entries = data ?? [];
  const totalIn = entries.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
  const totalOut = entries.filter((e) => e.amount < 0).reduce((s, e) => s - e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="animate-rise">
        <h1 className="text-2xl font-semibold text-foreground">Balance History</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every change to your balance, newest first.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 animate-fade">
        <div className="rounded-2xl border border-border/70 surface-gradient p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Money in</p>
          {isLoading ? <Skeleton className="mt-2 h-7 w-20" /> : <p className="mt-1 font-display text-2xl font-semibold text-primary">+{money(totalIn)}</p>}
        </div>
        <div className="rounded-2xl border border-border/70 surface-gradient p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Money out</p>
          {isLoading ? <Skeleton className="mt-2 h-7 w-20" /> : <p className="mt-1 font-display text-2xl font-semibold text-destructive">-{money(totalOut)}</p>}
        </div>
      </section>

      <section className="space-y-3">
        {error ? (
          <p className="text-sm text-destructive">Couldn't load your history. Please refresh.</p>
        ) : isLoading ? (
          <>
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">No balance activity yet.</p>
          </div>
        ) : (
          <div className="stagger space-y-3">
            {entries.map((e) => {
              const Icon = ICONS[e.kind];
              const plus = e.amount >= 0;
              return (
                <div key={e.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${plus ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{e.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {stamp(e.at)}
                        {e.note ? ` · ${e.note}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 font-display text-base font-semibold ${plus ? "text-primary" : "text-destructive"}`}>
                    {plus ? "+" : "-"}
                    {money(e.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
