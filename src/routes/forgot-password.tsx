import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPhone, isValidPhone } from "@/lib/phone";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — DollarCash" },
      { name: "description", content: "Recover access to your DollarCash account with your phone number." },
      { property: "og:title", content: "Reset password — DollarCash" },
      { property: "og:description", content: "Start a password recovery request for your DollarCash account." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidPhone(phone)) {
      toast.error("Enter a valid phone number");
      return;
    }
    setSubmitted(true);
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Confirm the phone number on your account to start recovery."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-primary">
            Back to sign in
          </Link>
        </>
      }
    >
      {submitted ? (
        <div className="space-y-3 text-center animate-rise">
          <ShieldCheck className="mx-auto size-10 text-primary" />
          <p className="font-display text-lg font-semibold text-foreground">Recovery requested</p>
          <p className="text-sm text-muted-foreground">
            SMS code delivery for {formatPhone(phone)} is coming soon. Until then our support team verifies
            recovery requests manually.
          </p>
          <Button asChild variant="secondary" className="tap mt-2 w-full rounded-xl">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="03xx xxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="tap h-12 w-full rounded-xl text-base">
            Continue
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
