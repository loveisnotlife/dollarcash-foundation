import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ReferralStats = {
  referral_code: string | null;
  total_invites: number;
  successful_invites: number;
  rewards_earned: number;
};

export const REFERRAL_MILESTONES = [
  { milestone: 5, reward: 1 },
  { milestone: 10, reward: 2 },
  { milestone: 25, reward: 5 },
  { milestone: 50, reward: 10 },
] as const;

/** Referral counts and rewards for the signed-in user (server-computed). */
export function useReferralStats() {
  return useQuery({
    queryKey: ["referral-stats"],
    queryFn: async (): Promise<ReferralStats> => {
      const { data, error } = await supabase.rpc("my_referral_stats");
      if (error) throw error;
      const raw = (data ?? {}) as Record<string, unknown>;
      return {
        referral_code: (raw['referral_code'] as string | null) ?? null,
        total_invites: Number(raw['total_invites'] ?? 0),
        successful_invites: Number(raw['successful_invites'] ?? 0),
        rewards_earned: Number(raw['rewards_earned'] ?? 0),
      };
    },
    staleTime: 30_000,
  });
}

export type ReferralReward = {
  id: string;
  milestone: number;
  reward_amount: number;
  created_at: string;
};

/** Milestone rewards already paid to the signed-in user. RLS scopes the read. */
export function useReferralRewards() {
  return useQuery({
    queryKey: ["referral-rewards"],
    queryFn: async (): Promise<ReferralReward[]> => {
      const { data, error } = await supabase
        .from("referral_rewards")
        .select("id, milestone, reward_amount, created_at")
        .order("milestone", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ReferralReward[];
    },
    staleTime: 30_000,
  });
}
