import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — DollarCash" },
      { name: "description", content: "Withdrawals from your DollarCash wallet are coming soon." },
      { property: "og:title", content: "Withdraw — DollarCash" },
      { property: "og:description", content: "Cash out your DollarCash balance." },
    ],
  }),
  component: () => <ComingSoon title="Withdraw" description="Send your balance to your payout method." />,
});
