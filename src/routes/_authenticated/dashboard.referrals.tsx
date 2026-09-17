import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/referrals")({
  head: () => ({
    meta: [
      { title: "Referrals — DollarCash" },
      { name: "description", content: "Referral rewards tracking is coming soon to DollarCash." },
      { property: "og:title", content: "Referrals — DollarCash" },
      { property: "og:description", content: "Invite friends and track your referral rewards." },
    ],
  }),
  component: () => <ComingSoon title="Referrals" description="Invite friends and track your team." />,
});
