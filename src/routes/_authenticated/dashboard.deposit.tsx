import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Upload, Wallet } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSettings, useMyDeposits, type DepositMethod } from "@/hooks/useDeposits";

export const Route = createFileRoute("/_authenticated/dashboard/deposit")({
  head: () => ({
    meta: [
      { title: "Deposit — DollarCash" },
      { name: "description", content: "Add funds to your DollarCash wallet with EasyPaisa or JazzCash." },
      { property: "og:title", content: "Deposit — DollarCash" },
      { property: "og:description", content: "Top up your DollarCash balance securely." },
    ],
  }),
  component: DepositPage,
});

const METHODS: { value: DepositMethod; label: string }[] = [
  { value: "EASYPAISA", label: "EasyPaisa" },
  { value: "JAZZCASH", label: "JazzCash" },
];

const money = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const pkr = (value: number) =>
  `Rs ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const stamp = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-accent/15 text-accent-foreground border-accent/40",
  APPROVED: "bg-primary/15 text-primary border-primary/40",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/40",
};

function DepositPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading: settingsLoading } = useAppSettings();
  const { data: deposits, isLoading: depositsLoading } = useMyDeposits();

  const [method, setMethod] = useState<DepositMethod>("EASYPAISA");
  const [amount, setAmount] = useState("");
  const [tid, setTid] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const rate = Number(settings?.usd_pkr_rate ?? 0);
  const usd = Number(amount);
  const converted = Number.isFinite(usd) && usd > 0 ? usd * rate : 0;

  const submit = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Please sign in again.");

      if (!Number.isFinite(usd) || usd <= 0) throw new Error("Enter a valid USD amount.");
      if (tid.trim().length < 4) throw new Error("Enter the transaction ID (TID) from your receipt.");
      if (!file) throw new Error("Attach a payment screenshot.");

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`;
      const upload = await supabase.storage
        .from("deposit-proofs")
        .upload(path, file, file.type ? { contentType: file.type } : {});
      if (upload.error) throw upload.error;

      // Rate, PKR amount and PENDING status are all set server-side by the database.
      const { error } = await supabase.from("deposits").insert({
        user_id: auth.user.id,
        method,
        amount_usd: usd,
        amount_pkr: 0,
        usd_pkr_rate: 0,
        tid: tid.trim(),
        screenshot_path: path,
        status: "PENDING",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deposit request submitted. An admin will review it shortly.");
      setAmount("");
      setTid("");
      setFile(null);
      void queryClient.invalidateQueries({ queryKey: ["deposits"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not submit your deposit."),
  });

  function copy(value: string, label: string) {
    void navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  }

  return (
    <div className="space-y-6">
      <div className="animate-rise">
        <h1 className="text-2xl font-semibold text-foreground">Deposit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send the PKR amount to the account below, then submit your transaction ID and screenshot.
        </p>
      </div>

      <section className="rounded-2xl border border-border/70 surface-gradient p-5 glow-ring animate-fade">
        <div className="flex items-center gap-2 text-gold">
          <Wallet className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Payment details</span>
        </div>
        {settingsLoading ? (
          <Skeleton className="mt-4 h-16 w-full" />
        ) : (
          <div className="mt-4 space-y-3">
            <DetailRow
              label="Account title"
              value={settings?.account_title ?? "—"}
              onCopy={() => copy(settings?.account_title ?? "", "Account title")}
            />
            <DetailRow
              label="Account number"
              value={settings?.account_number ?? "—"}
              onCopy={() => copy(settings?.account_number ?? "", "Account number")}
            />
            <DetailRow label="Accepted" value="EasyPaisa · JazzCash" />
            <DetailRow label="Rate" value={`$1 = ${pkr(rate)}`} />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-5 animate-fade">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>Payment method</Label>
            <div className="grid grid-cols-2 gap-3">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`tap rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                    method === m.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 text-muted-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="10.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              You send{" "}
              <span className="font-semibold gold-text">{pkr(converted)}</span> for{" "}
              {money(Number.isFinite(usd) ? Math.max(usd, 0) : 0)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tid">Transaction ID (TID)</Label>
            <Input
              id="tid"
              placeholder="From your EasyPaisa / JazzCash receipt"
              value={tid}
              onChange={(event) => setTid(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="screenshot">Payment screenshot</Label>
            <label
              htmlFor="screenshot"
              className="tap flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border/70 bg-background/40 p-4 text-sm text-muted-foreground"
            >
              <Upload className="size-4 shrink-0 text-primary" />
              <span className="truncate">{file ? file.name : "Choose an image"}</span>
            </label>
            <input
              id="screenshot"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>

          <Button type="submit" className="tap w-full" disabled={submit.isPending}>
            {submit.isPending ? "Submitting…" : "Submit deposit request"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Your balance is credited only after an admin approves the request.
          </p>
        </form>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Deposit history
        </p>
        {depositsLoading ? (
          <>
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </>
        ) : (deposits ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">No deposit requests yet.</p>
          </div>
        ) : (
          <div className="stagger space-y-3">
            {(deposits ?? []).map((d) => (
              <div key={d.id} className="rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold text-foreground">
                      {money(Number(d.amount_usd))}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {pkr(Number(d.amount_pkr))} ·{" "}
                      {d.method === "EASYPAISA" ? "EasyPaisa" : "JazzCash"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">TID {d.tid}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{stamp(d.created_at)}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      STATUS_STYLES[d.status] ?? "border-border/70 text-muted-foreground"
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
                {d.status === "REJECTED" && d.rejection_reason ? (
                  <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {d.rejection_reason}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DetailRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="flex min-w-0 items-center gap-1">
        <span className="truncate text-sm font-medium text-foreground">{value}</span>
        {onCopy ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="tap size-7 rounded-full"
            onClick={onCopy}
            aria-label={`Copy ${label}`}
          >
            <Copy className="size-3.5" />
          </Button>
        ) : null}
      </span>
    </div>
  );
}
