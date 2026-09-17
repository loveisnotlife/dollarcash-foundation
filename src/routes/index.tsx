import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LineChart, ShieldCheck, Smartphone } from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DollarCash — Your Modern Earning Wallet" },
      {
        name: "description",
        content:
          "DollarCash is a mobile-first earning wallet: sign in with your phone, track your balance, plans and referrals.",
      },
      { property: "og:title", content: "DollarCash — Your Modern Earning Wallet" },
      {
        property: "og:description",
        content: "Phone-based sign in, a clear balance view and referral rewards, built for mobile.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Smartphone, title: "Phone-first sign in", text: "No email needed — your number is your ID." },
  { icon: ShieldCheck, title: "Protected balances", text: "Balances and roles are locked server-side." },
  { icon: LineChart, title: "Clear earnings view", text: "Plans, earnings and referrals in one dashboard." },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-primary/25 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -right-16 top-60 size-64 rounded-full bg-gold/20 blur-3xl animate-float [animation-delay:2s]" />

      <header className="relative flex items-center justify-between px-5 py-5">
        <BrandMark />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" className="tap rounded-xl">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-5xl px-5 pb-20">
        <section className="animate-rise pt-8 text-center sm:pt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Mobile-first earning wallet
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Grow your balance with <span className="gold-text">DollarCash</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
            A calm, premium place to track your money, plans and referral rewards — secured end to end.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="tap h-12 rounded-xl px-8 text-base">
              <Link to="/register">
                Create account <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" className="tap h-12 rounded-xl px-8 text-base">
              <Link to="/login">I already have an account</Link>
            </Button>
          </div>
        </section>

        <section className="stagger mt-14 grid gap-3 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border/70 surface-gradient p-5 glow-ring">
              <Icon className="size-5 text-primary" />
              <p className="mt-3 font-display text-lg font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
