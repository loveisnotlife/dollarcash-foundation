import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type WithdrawMethod = "EASYPAISA" | "JAZZCASH";

export const MIN_WITHDRAWAL = 0.15;

export type Withdrawal = {
  id: string;
  method: string;
  account_title: string;
  account_number: string;
  amount_usd: number;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export type AdminWithdrawal = Withdrawal & {
  user_id: string;
  full_name: string;
  phone: string;
};

/** The signed-in member's own withdrawal requests. Row-level security scopes the read. */
export function useMyWithdrawals() {
  return useQuery({
    queryKey: ["withdrawals"],
    queryFn: async (): Promise<Withdrawal[]> => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select(
          "id, method, account_title, account_number, amount_usd, status, rejection_reason, created_at, reviewed_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Withdrawal[];
    },
  });
}

export type WithdrawalGate = { allowed: boolean; required_referrals: number; paid_referrals: number };

/** Server-computed paid-referral requirement for the next withdrawal. */
export function useWithdrawalGate() {
  return useQuery({
    queryKey: ["withdrawal-gate"],
    queryFn: async (): Promise<WithdrawalGate> => {
      const { data, error } = await supabase.rpc("my_withdrawal_gate" as never);
      if (error) throw error;
      const raw = (data ?? {}) as Record<string, unknown>;
      return {
        allowed: Boolean(raw["allowed"] ?? true),
        required_referrals: Number(raw["required_referrals"] ?? 0),
        paid_referrals: Number(raw["paid_referrals"] ?? 0),
      };
    },
  });
}

/** Admin-only withdrawal list, authorized inside the database function. */
export function useAdminWithdrawals(status: string | null) {
  return useQuery({
    queryKey: ["admin-withdrawals", status],
    queryFn: async (): Promise<AdminWithdrawal[]> => {
      const { data, error } = await supabase.rpc(
        "admin_list_withdrawals",
        status ? { _status: status } : {},
      );
      if (error) throw error;
      return (data ?? []) as unknown as AdminWithdrawal[];
    },
  });
}
