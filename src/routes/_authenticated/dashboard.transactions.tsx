import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";

import { useProfitPayments } from "@/hooks/useEarnings";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — DollarCash" },
      { name: "description", content: "Your DollarCash daily profit payouts and account history." },
      { property: "og:title", content: "Transactions — DollarCash" },
      { property: "og:description", content: "Review every daily profit credited to your balance." },
    ],
  }),
  component: Transactions,
});

const money = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const stamp = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function Transactions() {
  const { data: payments, isLoading } = useProfitPayments();
  const total = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="animate-rise">
        <h1 className="text-2xl font-semibold text-foreground">Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daily profit is credited automatically at 12:00 AM (Pakistan time).
        </p>
      </div>

      <section className="rounded-2xl border border-border/70 surface-gradient p-5 animate-fade">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Total profit credited
        </p>
        {isLoading ? (
          <Skeleton className="mt-3 h-8 w-28" />
        ) : (
          <p className="mt-2 font-display text-3xl font-semibold gold-text">{money(total)}</p>
        )}
      </section>

      <section className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </>
        ) : (payments ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No profit payments yet. Buy an investment plan and your first daily profit arrives at
              midnight.
            </p>
          </div>
        ) : (
          <div className="stagger space-y-3">
            {(payments ?? []).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <TrendingUp className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      Daily profit — {p.plan_name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{stamp(p.created_at)}</p>
                  </div>
                </div>
                <span className="shrink-0 font-display text-base font-semibold text-primary">
                  +{money(Number(p.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
