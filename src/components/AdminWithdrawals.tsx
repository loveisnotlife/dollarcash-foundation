import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminWithdrawals, type AdminWithdrawal } from "@/hooks/useWithdrawals";

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

const FILTERS: { label: string; value: string | null }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "All", value: null },
];

export function AdminWithdrawals() {
  const [filter, setFilter] = useState<string | null>("PENDING");
  const { data: withdrawals, isLoading } = useAdminWithdrawals(filter);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`tap rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              filter === f.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/70 text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <>
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </>
      ) : (withdrawals ?? []).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">No withdrawals in this view.</p>
        </div>
      ) : (
        <div className="stagger space-y-3">
          {(withdrawals ?? []).map((withdrawal) => (
            <WithdrawalRow key={withdrawal.id} withdrawal={withdrawal} />
          ))}
        </div>
      )}
    </section>
  );
}

function WithdrawalRow({ withdrawal }: { withdrawal: AdminWithdrawal }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [showReason, setShowReason] = useState(false);

  const review = useMutation({
    mutationFn: async (approve: boolean) => {
      const { error } = await supabase.rpc("review_withdrawal", {
        _withdrawal_id: withdrawal.id,
        _approve: approve,
        ...(approve ? {} : { _reason: reason.trim() }),
      });
      if (error) throw error;
      return approve;
    },
    onSuccess: (approve) => {
      toast.success(approve ? "Withdrawal approved" : "Withdrawal rejected and refunded");
      setShowReason(false);
      setReason("");
      void queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not review this withdrawal."),
  });

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {withdrawal.full_name || "Member"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{withdrawal.phone}</p>
          <p className="mt-2 font-display text-lg font-semibold gold-text">
            {money(Number(withdrawal.amount_usd))}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {withdrawal.method === "EASYPAISA" ? "EasyPaisa" : "JazzCash"} ·{" "}
            {withdrawal.account_number}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {withdrawal.account_title}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{stamp(withdrawal.created_at)}</p>
        </div>
        <span className="shrink-0 rounded-full border border-border/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {withdrawal.status}
        </span>
      </div>

      {withdrawal.status === "REJECTED" && withdrawal.rejection_reason ? (
        <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {withdrawal.rejection_reason}
        </p>
      ) : null}

      {withdrawal.status === "PENDING" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="tap"
            disabled={review.isPending}
            onClick={() => review.mutate(true)}
          >
            <Check className="size-4" />
            Approve
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="tap"
            disabled={review.isPending}
            onClick={() => {
              if (!showReason) {
                setShowReason(true);
                return;
              }
              if (reason.trim().length < 3) {
                toast.error("Enter a rejection reason.");
                return;
              }
              review.mutate(false);
            }}
          >
            <X className="size-4" />
            Reject
          </Button>
        </div>
      ) : null}

      {showReason ? (
        <Input
          className="mt-3"
          placeholder="Reason for rejection"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      ) : null}
    </div>
  );
}
