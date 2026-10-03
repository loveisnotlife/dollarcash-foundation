import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export async function generateBudget(input: { income: number; expenses: number; goal: number; notes: string }) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system:
      "You are a friendly personal budgeting coach for members in Pakistan. Write a practical monthly budget in markdown: a short summary, a category table (Needs, Wants, Savings) with amounts, how long to reach the savings goal, and 4-6 concrete tips. Keep under 350 words. Do not give investment advice or promote any product.",
    prompt: `Monthly income: ${input.income}\nMonthly expenses: ${input.expenses}\nSavings goal: ${input.goal}\nNotes: ${input.notes || "none"}`,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return await result.text;
}
