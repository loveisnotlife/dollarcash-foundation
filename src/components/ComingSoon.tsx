import { Sparkles } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="animate-rise">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

      <div className="mt-6 grid place-items-center rounded-3xl border border-border/70 surface-gradient px-6 py-16 text-center glow-ring">
        <Sparkles className="size-9 text-gold animate-float" />
        <p className="mt-4 font-display text-xl font-semibold text-foreground">Coming Soon</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This feature is being prepared for the next release of DollarCash.
        </p>
      </div>
    </div>
  );
}
