import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  role: "user" | "admin";
  balance: number;
  referral_code: string;
  referred_by: string | null;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
};

/** Reads the signed-in user's own profile. Row-level security scopes the read. */
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as Profile | null) ?? null;
    },
    staleTime: 30_000,
  });
}
