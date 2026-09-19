import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProfitPayment = {
  id: string;
  plan_name: string;
  amount: number;
  profit_date: string;
  created_at: string;
};

/** Daily profit payments credited to the signed-in user. RLS scopes the read. */
export function useProfitPayments(limit = 50) {
  return useQuery({
    queryKey: ["profit-payments", limit],
    queryFn: async (): Promise<ProfitPayment[]> => {
      const { data, error } = await supabase
        .from("profit_payments")
        .select("id, plan_name, amount, profit_date, created_at")
        .order("profit_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as ProfitPayment[];
    },
    staleTime: 30_000,
  });
}

/** Aggregate figures for the dashboard cards. */
export function useEarningsSummary() {
  return useQuery({
    queryKey: ["earnings-summary"],
    queryFn: async () => {
      const [payments, investments] = await Promise.all([
        supabase.from("profit_payments").select("amount"),
        supabase.from("user_investments").select("status, expires_at"),
      ]);
      if (payments.error) throw payments.error;
      if (investments.error) throw investments.error;

      const totalEarnings = (payments.data ?? []).reduce(
        (sum, row) => sum + Number(row.amount ?? 0),
        0,
      );
      const now = Date.now();
      const activePlans = (investments.data ?? []).filter(
        (row) => row.status === "ACTIVE" && new Date(row.expires_at).getTime() > now,
      ).length;

      return { totalEarnings, activePlans, payoutCount: (payments.data ?? []).length };
    },
    staleTime: 30_000,
  });
}
