import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/BrandMark";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-32 -left-24 size-72 rounded-full bg-primary/25 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -right-20 top-40 size-64 rounded-full bg-gold/20 blur-3xl animate-float [animation-delay:1.5s]" />

      <header className="relative flex items-center justify-between px-5 py-5">
        <Link to="/" className="tap">
          <BrandMark />
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative mx-auto w-full max-w-md px-5 pb-16">
        <div className="animate-rise">
          <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="mt-7 rounded-3xl border border-border/70 surface-gradient p-5 glow-ring animate-fade sm:p-6">
          {children}
        </div>

        {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </main>
    </div>
  );
}
