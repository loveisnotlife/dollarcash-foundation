import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CheckSquare, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard/tasks")({
  head: () => ({
    meta: [
      { title: "Daily Tasks — DollarCash" },
      { name: "description", content: "Complete your DollarCash daily check-in and earn your plan's daily return." },
      { property: "og:title", content: "Daily Tasks — DollarCash" },
      { property: "og:description", content: "Complete short daily tasks to earn rewards." },
    ],
  }),
  component: TasksPage,
});

type Task = { id: string; title: string; description: string; reward: number; done: boolean };
type TasksToday = { eligible: boolean; tasks: Task[] };

function TasksPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["tasks-today"],
    queryFn: async (): Promise<TasksToday> => {
      const { data, error } = await supabase.rpc("my_tasks_today");
      if (error) throw error;
      return data as unknown as TasksToday;
    },
  });

  const complete = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("complete_task", { _task_id: id });
      if (error) throw error;
      return Number((data as { reward?: number } | null)?.reward ?? 0);
    },
    onSuccess: (reward) => {
      toast.success(`Task complete — $${reward.toFixed(2)} added to your balance`);
      qc.invalidateQueries({ queryKey: ["tasks-today"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["tasks-today"] });
    },
  });

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-sm text-muted-foreground">Daily Tasks</p>
        <h1 className="text-2xl font-semibold text-foreground">Earn every day</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tasks reset daily at 12:00 AM Pakistan time.</p>
      </header>

      {q.isLoading ? (
        <Skeleton className="h-36 rounded-3xl" />
      ) : q.error ? (
        <p className="text-sm text-destructive">Couldn't load tasks. Please refresh.</p>
      ) : !q.data?.eligible ? (
        <div className="rounded-3xl border border-border/70 surface-gradient p-6 text-center glow-ring">
          <Lock className="mx-auto size-6 text-gold" />
          <p className="mt-3 font-display text-lg font-semibold text-foreground">For members with an active plan</p>
          <p className="mt-1 text-sm text-muted-foreground">Activate any investment plan to unlock daily tasks.</p>
          <Button asChild className="tap mt-4 rounded-full">
            <Link to="/dashboard/plans">View plans</Link>
          </Button>
        </div>
      ) : (
        <div className="stagger space-y-3">
          {q.data.tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-4 rounded-3xl border border-border/70 surface-gradient p-5 glow-ring">
              <CheckSquare className="size-6 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold text-foreground">{t.title}</p>
                {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                <p className="mt-1 text-sm font-semibold gold-text">+${Number(t.reward).toFixed(2)}</p>
              </div>
              {t.done ? (
                <span className="flex items-center gap-1 text-sm font-medium text-primary">
                  <CheckCircle2 className="size-4" /> Done today
                </span>
              ) : (
                <Button className="tap rounded-full" disabled={complete.isPending} onClick={() => complete.mutate(t.id)}>
                  {complete.isPending ? <Loader2 className="size-4 animate-spin" /> : "Complete"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
