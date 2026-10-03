import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAppSettings } from "@/hooks/useDeposits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

/** Admin edits; database policies allow writes only for verified admins. */
export function AdminDepositAccount() {
  const qc = useQueryClient();
  const { data } = useAppSettings();
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState("");
  useEffect(() => {
    if (data) {
      setTitle(data.account_title);
      setNumber(data.account_number);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (title.trim().length < 2 || !/^\d{10,13}$/.test(number.trim()))
        throw new Error("Enter a valid name and account number");
      const { data: rows, error } = await supabase
        .from("app_settings")
        .update({ account_title: title.trim(), account_number: number.trim() })
        .eq("id", true)
        .select("id");
      if (error) throw error;
      if (!rows?.length) throw new Error("Not allowed");
    },
    onSuccess: () => {
      toast.success("Deposit account updated");
      qc.invalidateQueries({ queryKey: ["app-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3 rounded-2xl border border-border/70 surface-gradient p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Account title" />
        <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Account number" inputMode="numeric" />
      </div>
      <Button className="tap rounded-full" disabled={save.isPending} onClick={() => save.mutate()}>
        {save.isPending && <Loader2 className="size-4 animate-spin" />} Save account
      </Button>
    </div>
  );
}

type PlanRow = { id: string; name: string; cost: number; is_active: boolean };

export function AdminPlans() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async (): Promise<PlanRow[]> => {
      const { data, error } = await supabase
        .from("investment_plans")
        .select("id, name, cost, is_active")
        .order("sort_order");
      if (error) throw error;
      return data as PlanRow[];
    },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { data, error } = await supabase
        .from("investment_plans")
        .update({ is_active: active })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Not allowed");
    },
    onSuccess: (_d, v) => {
      toast.success(v.active ? "Plan activated" : "Plan deactivated");
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      qc.invalidateQueries({ queryKey: ["investment-plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="divide-y divide-border/70 rounded-2xl border border-border/70 surface-gradient">
      {q.isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
      {q.data?.map((p) => (
        <div key={p.id} className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium text-foreground">{p.name}</p>
            <p className="text-xs text-muted-foreground">${Number(p.cost).toFixed(2)} · {p.is_active ? "Active" : "Hidden"}</p>
          </div>
          <Switch
            checked={p.is_active}
            disabled={toggle.isPending}
            onCheckedChange={(v) => toggle.mutate({ id: p.id, active: v })}
          />
        </div>
      ))}
    </div>
  );
}
