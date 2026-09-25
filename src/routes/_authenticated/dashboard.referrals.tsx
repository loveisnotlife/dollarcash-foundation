import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Gift, Share2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  REFERRAL_MILESTONES,
  useReferralRewards,
  useReferralStats,
} from "@/hooks/useReferrals";

export const Route = createFileRoute("/_authenticated/dashboard/referrals")({
  head: () => ({
    meta: [
      { title: "Referrals — DollarCash" },
      {
        name: "description",
        content: "Track your DollarCash invites and milestone rewards.",
      },
      { property: "og:title", content: "Referrals — DollarCash" },
      {
        property: "og:description",
        content: "Invite friends and unlock milestone rewards.",
      },
    ],
  }),
  component: ReferralsPage,
});

const money = (value: number) =>
  `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function ReferralsPage() {
  const { data: stats, isLoading } = useReferralStats();
  const { data: rewards } = useReferralRewards();

  const successful = stats?.successful_invites ?? 0;
  const paid = new Set((rewards ?? []).map((r) => r.milestone));

  const referralLink =
    typeof window !== "undefined" && stats?.referral_code
      ? `${window.location.origin}/register?ref=${encodeURIComponent(
          stats.referral_code,
        )}`
      : "";

  function copyCode() {
    if (!stats?.referral_code) return;

    void navigator.clipboard.writeText(stats.referral_code);
    toast.success("Referral code copied");
  }

  function copyReferralLink() {
    if (!referralLink) return;

    void navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied");
  }

  function shareOnWhatsApp() {
    if (!referralLink) return;

    const message = `Join DollarCash using my referral link:\n${referralLink}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-6">
      <div className="animate-rise">
        <h1 className="text-2xl font-semibold text-foreground">
          Referrals
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Invite friends and earn one-time milestone rewards.
        </p>
      </div>

      <section className="stagger grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <Users className="size-4 text-primary" />

          <p className="mt-3 font-display text-xl font-semibold text-foreground">
            {isLoading ? (
              <Skeleton className="h-6 w-10" />
            ) : (
              successful
            )}
          </p>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Successful invites
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <Gift className="size-4 text-primary" />

          <p className="mt-3 font-display text-xl font-semibold text-foreground">
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              money(stats?.rewards_earned ?? 0)
            )}
          </p>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Rewards earned
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 surface-gradient p-5 animate-fade">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Your referral code
        </p>

        <div className="mt-3 flex items-center justify-between gap-3">
          {isLoading ? (
            <Skeleton className="h-7 w-32" />
          ) : (
            <span className="font-display text-2xl font-semibold gold-text">
              {stats?.referral_code ?? "—"}
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={copyCode}
            className="tap rounded-full"
            aria-label="Copy referral code"
          >
            <Copy className="size-4" />
          </Button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          An invite counts once your friend registers and activates an
          investment plan.
        </p>

        {/* Referral Link */}
        <div className="mt-5 border-t border-border/60 pt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Your referral link
          </p>

          <div className="mt-2 flex items-center gap-2">
            <div className="min-w-0 flex-1 rounded-xl bg-background/60 px-3 py-2">
              <p className="truncate text-xs text-muted-foreground">
                {isLoading
                  ? "Generating referral link..."
                  : referralLink || "—"}
              </p>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={copyReferralLink}
              disabled={!referralLink}
              className="tap shrink-0 rounded-full"
              aria-label="Copy referral link"
            >
              <Copy className="size-4" />
            </Button>
          </div>

          <Button
            type="button"
            onClick={shareOnWhatsApp}
            disabled={!referralLink}
            className="mt-3 w-full gap-2"
          >
            <Share2 className="size-4" />
            Share on WhatsApp
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Milestone rewards
        </p>

        {REFERRAL_MILESTONES.map(({ milestone, reward }) => {
          const done = paid.has(milestone);
          const progress = Math.min(successful / milestone, 1) * 100;

          return (
            <div
              key={milestone}
              className="rounded-2xl border border-border/70 bg-card p-4 animate-fade"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {milestone} invites
                </p>

                <span className="flex items-center gap-1 font-display text-sm font-semibold gold-text">
                  {done && <Check className="size-3.5" />}
                  {money(reward)}
                </span>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full brand-gradient transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                {done
                  ? "Reward credited"
                  : `${Math.min(successful, milestone)} / ${milestone} invites`}
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
