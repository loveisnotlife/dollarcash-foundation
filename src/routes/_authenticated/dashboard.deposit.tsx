import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/deposit")({
  head: () => ({
    meta: [
      { title: "Deposit — DollarCash" },
      { name: "description", content: "Adding funds to your DollarCash wallet is coming soon." },
      { property: "og:title", content: "Deposit — DollarCash" },
      { property: "og:description", content: "Top up your DollarCash balance securely." },
    ],
  }),
  component: () => <ComingSoon title="Deposit" description="Add funds to your DollarCash wallet." />,
});
