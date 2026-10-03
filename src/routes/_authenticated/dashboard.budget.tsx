import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { createBudget } from "@/lib/budget.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/dashboard/budget")({
  head: () => ({
    meta: [
      { title: "AI Budget Planner — DollarCash" },
      { name: "description", content: "Get a personalized monthly budget from your income, expenses and savings goal." },
      { property: "og:title", content: "AI Budget Planner — DollarCash" },
      { property: "og:description", content: "AI-powered personal budgeting for DollarCash members." },
    ],
  }),
  component: BudgetPage,
});

function BudgetPage() {
  const run = useServerFn(createBudget);
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [goal, setGoal] = useState("");
  const [notes, setNotes] = useState("");
  const m = useMutation({
    mutationFn: () =>
      run({ data: { income: Number(income), expenses: Number(expenses), goal: Number(goal), notes } }),
  });
  const valid = Number(income) > 0 && Number(expenses) >= 0 && Number(goal) >= 0 && expenses !== "" && goal !== "";

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-sm text-muted-foreground">Budget Planner</p>
        <h1 className="text-2xl font-semibold text-foreground">Your AI-powered budget</h1>
        <p className="mt-1 text-sm text-muted-foreground">Amounts in PKR per month.</p>
      </header>
      <div className="space-y-3 rounded-3xl border border-border/70 surface-gradient p-5 glow-ring">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input inputMode="decimal" placeholder="Monthly income" value={income} onChange={(e) => setIncome(e.target.value)} />
          <Input inputMode="decimal" placeholder="Monthly expenses" value={expenses} onChange={(e) => setExpenses(e.target.value)} />
          <Input inputMode="decimal" placeholder="Savings goal" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </div>
        <Textarea placeholder="Anything else? (rent, family, debts…)" value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} />
        <Button className="tap rounded-full" disabled={!valid || m.isPending} onClick={() => m.mutate()}>
          {m.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Create my budget
        </Button>
      </div>
      {m.data?.error && <p className="text-sm text-destructive">{m.data.error}</p>}
      {m.error && <p className="text-sm text-destructive">Something went wrong. Please try again.</p>}
      {m.data?.plan && (
        <div className="animate-rise whitespace-pre-wrap rounded-3xl border border-border/70 bg-card p-5 text-sm leading-relaxed text-foreground">
          {m.data.plan}
        </div>
      )}
    </div>
  );
}
