import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/tasks")({
  head: () => ({
    meta: [
      { title: "Daily Tasks — DollarCash" },
      { name: "description", content: "Daily earning tasks are coming soon to DollarCash." },
      { property: "og:title", content: "Daily Tasks — DollarCash" },
      { property: "og:description", content: "Complete short daily tasks to earn rewards." },
    ],
  }),
  component: () => <ComingSoon title="Daily Tasks" description="Earn rewards for simple daily actions." />,
});
