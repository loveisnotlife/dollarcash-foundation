import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Coins, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard/plans")({
  head: () => ({
    meta: [
      { title: "Investment Plans — DollarCash" },
      {
        name: "description",
        content: "Choose a DollarCash investment plan and earn a fixed daily return for 15 days.",
      },
      { property: "og:title", content: "Investment Plans — DollarCash" },
      { property: "og:description", content: "Fixed daily returns over 15 days on every DollarCash plan." },
    ],
  }),
  component: PlansPage,
});

type Plan = {
  id: string;
  name: string;
  cost: number;
  daily_return: number;
  duration_days: number;
  total_return: number;
};

type Investment = {
  id: string;
  plan_name: string;
  amount_invested: number;
  daily_return: number;
  activated_at: string;
  expires_at: string;
  status: string;
};

const money = (value: number) =>
  `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function PlansPage() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const plansQuery = useQuery({
    queryKey: ["investment-plans"],
    queryFn: async (): Promise<Plan[]> => {
      const { data, error } = await supabase
        .from("investment_plans")
        .select("id, name, cost, daily_return, duration_days, total_return")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Plan[];
    },
    staleTime: 5 * 60_000,
  });

  const investmentsQuery = useQuery({
    queryKey: ["user-investments"],
    queryFn: async (): Promise<Investment[]> => {
      const { data, error } = await supabase
        .from("user_investments")
        .select("id, plan_name, amount_invested, daily_return, activated_at, expires_at, status")
        .order("activated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Investment[];
    },
    refetchInterval: 60_000,
  });

  const buy = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase.rpc("purchase_investment_plan", { _plan_id: planId });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Plan activated");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-investments"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
      ]);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Purchase failed";
      toast.error(
        /insufficient/i.test(message)
          ? "Not enough balance. Please deposit first."
          : /suspended/i.test(message)
            ? "Your account is suspended."
            : message,
      );
    },
  });

  const balance = Number(profile?.balance ?? 0);

  return (
    <div className="space-y-7">
      <header className="animate-rise">
        <p className="text-sm text-muted-foreground">Investment Plans</p>
        <h1 className="text-2xl font-semibold text-foreground">Grow your balance daily</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Available balance <span className="font-semibold text-foreground">{money(balance)}</span>
        </p>
      </header>

      <section className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2">
        {plansQuery.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-3xl" />
            ))
          : (plansQuery.data ?? []).map((plan) => {
              const affordable = balance >= Number(plan.cost);
              const pending = buy.isPending && buy.variables === plan.id;
              return (
                <article
                  key={plan.id}
                  className="group relative overflow-hidden rounded-3xl border border-border/70 surface-gradient p-5 transition-transform duration-300 hover:-translate-y-1 glow-ring"
                >
                  <div className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-gold/20 blur-2xl transition-opacity duration-300 group-hover:opacity-100 sm:opacity-70" />
                  <div className="relative">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="font-display text-lg font-semibold text-foreground">{plan.name}</h2>
                      <span className="rounded-full border border-gold/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider gold-text">
                        {plan.duration_days} Days
                      </span>
                    </div>

                    <p className="mt-3 font-display text-3xl font-semibold text-foreground">
                      {money(plan.cost)}
                    </p>
                    <p className="text-xs text-muted-foreground">One-time cost</p>

                    <dl className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="flex items-center gap-2 text-muted-foreground">
                          <TrendingUp className="size-4 text-primary" /> Daily return
                        </dt>
                        <dd className="font-semibold text-foreground">{money(plan.daily_return)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="flex items-center gap-2 text-muted-foreground">
                          <Coins className="size-4 text-primary" /> Total return
                        </dt>
                        <dd className="font-semibold gold-text">{money(plan.total_return)}</dd>
                      </div>
                    </dl>

                    <Button
                      className="tap mt-5 w-full rounded-xl"
                      disabled={pending || buy.isPending || !affordable}
                      onClick={() => buy.mutate(plan.id)}
                    >
                      {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
                      {affordable ? "Buy Plan" : "Insufficient balance"}
                    </Button>
                  </div>
                </article>
              );
            })}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-foreground">My Investments</h2>

        {investmentsQuery.isLoading ? (
          <Skeleton className="h-28 rounded-2xl" />
        ) : (investmentsQuery.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-6 text-center text-sm text-muted-foreground">
            You have no investments yet. Buy a plan above to get started.
          </div>
        ) : (
          <ul className="stagger space-y-3">
            {(investmentsQuery.data ?? []).map((inv) => {
              const expired = inv.status === "EXPIRED" || new Date(inv.expires_at).getTime() <= Date.now();
              return (
                <li key={inv.id} className="rounded-2xl border border-border/70 bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-base font-semibold text-foreground">{inv.plan_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Invested {money(inv.amount_invested)} · Daily {money(inv.daily_return)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                        expired
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/15 text-primary"
                      }`}
                    >
                      {expired ? "Expired" : "Active"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <CalendarClock className="size-3.5 text-primary" /> Activated {when(inv.activated_at)}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarClock className="size-3.5 text-gold" /> Expires {when(inv.expires_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
