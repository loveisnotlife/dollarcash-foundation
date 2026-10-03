import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  income: z.number().positive().max(1e9),
  expenses: z.number().min(0).max(1e9),
  goal: z.number().min(0).max(1e10),
  notes: z.string().max(500).default(""),
});

export const createBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }) => {
    const { generateBudget } = await import("./budget.server");
    try {
      return { plan: await generateBudget(data) };
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 429) return { error: "Too many requests — please try again in a minute." };
      if (status === 402 || status === 403) return { error: "AI budgeting is temporarily unavailable." };
      console.error(e);
      return { error: "Couldn't create your budget. Please try again." };
    }
  });
