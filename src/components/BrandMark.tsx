export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-xl brand-gradient text-lg font-semibold text-primary-foreground glow-ring">
        <span className="gold-text">$</span>
      </span>
      {!compact && (
        <span className="font-display text-lg font-semibold tracking-tight text-foreground">
          Dollar<span className="gold-text">Cash</span>
        </span>
      )}
    </span>
  );
}
