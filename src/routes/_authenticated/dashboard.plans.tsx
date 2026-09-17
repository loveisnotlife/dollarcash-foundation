import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/plans")({
  head: () => ({
    meta: [
      { title: "Investment Plans — DollarCash" },
      { name: "description", content: "DollarCash investment plans are launching soon." },
      { property: "og:title", content: "Investment Plans — DollarCash" },
      { property: "og:description", content: "Plans and daily returns arrive in the next release." },
    ],
  }),
  component: () => (
    <ComingSoon title="Investment Plans" description="Choose a plan and grow your balance daily." />
  ),
});
