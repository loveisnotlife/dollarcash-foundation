import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DepositMethod = "EASYPAISA" | "JAZZCASH";

export type Deposit = {
  id: string;
  method: string;
  amount_usd: number;
  amount_pkr: number;
  usd_pkr_rate: number;
  tid: string;
  screenshot_path: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export type AdminDeposit = Deposit & {
  user_id: string;
  full_name: string;
  phone: string;
};

export type AppSettings = {
  usd_pkr_rate: number;
  account_title: string;
  account_number: string;
};

/** Admin-configured USD/PKR rate and payment account details. */
export function useAppSettings() {
  return useQuery({
    queryKey: ["app-settings"],
    queryFn: async (): Promise<AppSettings | null> => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("usd_pkr_rate, account_title, account_number")
        .maybeSingle();
      if (error) throw error;
      return (data as AppSettings | null) ?? null;
    },
    staleTime: 60_000,
  });
}

/** The signed-in member's own deposit requests. Row-level security scopes the read. */
export function useMyDeposits() {
  return useQuery({
    queryKey: ["deposits"],
    queryFn: async (): Promise<Deposit[]> => {
      const { data, error } = await supabase
        .from("deposits")
        .select(
          "id, method, amount_usd, amount_pkr, usd_pkr_rate, tid, screenshot_path, status, rejection_reason, created_at, reviewed_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Deposit[];
    },
  });
}

/** Admin-only deposit list, authorized inside the database function. */
export function useAdminDeposits(status: string | null) {
  return useQuery({
    queryKey: ["admin-deposits", status],
    queryFn: async (): Promise<AdminDeposit[]> => {
      const { data, error } = await supabase.rpc(
        "admin_list_deposits",
        status ? { _status: status } : {},
      );
      if (error) throw error;
      return (data ?? []) as unknown as AdminDeposit[];
    },
  });
}
