import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — DollarCash" },
      { name: "description", content: "Your DollarCash transaction history is coming soon." },
      { property: "og:title", content: "Transactions — DollarCash" },
      { property: "og:description", content: "Review every deposit, withdrawal and reward." },
    ],
  }),
  component: () => <ComingSoon title="Transactions" description="A full history of every movement." />,
});
