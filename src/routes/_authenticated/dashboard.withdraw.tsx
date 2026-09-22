import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile";
import { MIN_WITHDRAWAL, useMyWithdrawals, type WithdrawMethod } from "@/hooks/useWithdrawals";

export const Route = createFileRoute("/_authenticated/dashboard/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — DollarCash" },
      { name: "description", content: "Cash out your DollarCash balance to EasyPaisa or JazzCash." },
      { property: "og:title", content: "Withdraw — DollarCash" },
      { property: "og:description", content: "Request a payout from your DollarCash balance." },
    ],
  }),
  component: WithdrawPage,
});

const METHODS: { value: WithdrawMethod; label: string }[] = [
  { value: "EASYPAISA", label: "EasyPaisa" },
  { value: "JAZZCASH", label: "JazzCash" },
];

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

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-accent/15 text-accent-foreground border-accent/40",
  APPROVED: "bg-primary/15 text-primary border-primary/40",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/40",
};

function WithdrawPage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: withdrawals, isLoading: listLoading } = useMyWithdrawals();

  const [method, setMethod] = useState<WithdrawMethod>("EASYPAISA");
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");

  const balance = Number(profile?.balance ?? 0);
  const usd = Number(amount);

  const submit = useMutation({
    mutationFn: async () => {
      if (!Number.isFinite(usd) || usd <= 0) throw new Error("Enter a valid USD amount.");
      if (usd < MIN_WITHDRAWAL) throw new Error(`Minimum withdrawal is ${money(MIN_WITHDRAWAL)}.`);
      if (usd > balance) throw new Error("Amount is more than your available balance.");
      if (title.trim().length < 2) throw new Error("Enter the account title.");
      if (number.trim().length < 6) throw new Error("Enter a valid account number.");

      // Balance checks and the reservation happen server-side inside the database function.
      const { error } = await supabase.rpc("request_withdrawal", {
        _method: method,
        _account_title: title.trim(),
        _account_number: number.trim(),
        _amount_usd: usd,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Withdrawal request submitted. An admin will review it shortly.");
      setAmount("");
      void queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not submit your withdrawal."),
  });

  return (
    <div className="space-y-6">
      <div className="animate-rise">
        <h1 className="text-2xl font-semibold text-foreground">Withdraw</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Request a payout to your EasyPaisa or JazzCash account.
        </p>
      </div>

      <section className="rounded-2xl border border-border/70 surface-gradient p-5 glow-ring animate-fade">
        <div className="flex items-center gap-2 text-gold">
          <Wallet className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Available balance</span>
        </div>
        {profileLoading ? (
          <Skeleton className="mt-3 h-9 w-32" />
        ) : (
          <p className="mt-2 font-display text-3xl font-semibold text-foreground">{money(balance)}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Minimum withdrawal {money(MIN_WITHDRAWAL)}
        </p>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-5 animate-fade">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>Payout method</Label>
            <div className="grid grid-cols-2 gap-3">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`tap rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                    method === m.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 text-muted-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-title">Account title</Label>
            <Input
              id="account-title"
              placeholder="Name on the account"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-number">Account number</Label>
            <Input
              id="account-number"
              inputMode="numeric"
              placeholder="03xxxxxxxxx"
              value={number}
              onChange={(event) => setNumber(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              min="0.15"
              step="0.01"
              placeholder="0.15"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              You can withdraw up to{" "}
              <span className="font-semibold gold-text">{money(balance)}</span>
            </p>
          </div>

          <Button type="submit" className="tap w-full" disabled={submit.isPending}>
            {submit.isPending ? "Submitting…" : "Request withdrawal"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            The amount is held from your balance while an admin reviews the request, and refunded in
            full if it is rejected.
          </p>
        </form>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Withdrawal history
        </p>
        {listLoading ? (
          <>
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </>
        ) : (withdrawals ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">No withdrawal requests yet.</p>
          </div>
        ) : (
          <div className="stagger space-y-3">
            {(withdrawals ?? []).map((w) => (
              <div key={w.id} className="rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold text-foreground">
                      {money(Number(w.amount_usd))}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {w.method === "EASYPAISA" ? "EasyPaisa" : "JazzCash"} · {w.account_number}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {w.account_title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{stamp(w.created_at)}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      STATUS_STYLES[w.status] ?? "border-border/70 text-muted-foreground"
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
                {w.status === "REJECTED" && w.rejection_reason ? (
                  <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {w.rejection_reason} — amount refunded to your balance.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
