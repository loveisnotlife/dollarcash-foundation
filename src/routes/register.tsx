import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatPhone, isValidPhone, phoneToAuthEmail } from "@/lib/phone";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — DollarCash" },
      {
        name: "description",
        content:
          "Open your DollarCash account in seconds using just your phone number.",
      },
      { property: "og:title", content: "Create account — DollarCash" },
      {
        property: "og:description",
        content:
          "Register with your phone number and start tracking your earnings.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referral: "",
  });

  const [loading, setLoading] = useState(false);

  // Automatically read referral code from:
  // /register?ref=DCE813ED
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search)
      .get("ref")
      ?.trim()
      .toUpperCase();

    if (ref) {
      setForm((current) => ({
        ...current,
        referral: current.referral || ref,
      }));
    }
  }, []);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (form.fullName.trim().length < 3) {
      toast.error("Enter your full name");
      return;
    }

    if (!isValidPhone(form.phone)) {
      toast.error("Enter a valid phone number");
      return;
    }

    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: phoneToAuthEmail(form.phone),
      password: form.password,
      options: {
        data: {
          full_name: form.fullName.trim(),
          phone: formatPhone(form.phone),
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error || !data.user) {
      setLoading(false);
      toast.error(error?.message ?? "Could not create your account");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: form.fullName.trim(),
      phone: formatPhone(form.phone),
      referred_by: form.referral.trim()
        ? form.referral.trim().toUpperCase()
        : null,
    } as never);

    setLoading(false);

    if (profileError) {
      toast.error(
        "Account created, but your profile could not be saved. Please contact support.",
      );
      return;
    }

    toast.success("Account created");
    navigate({ to: "/dashboard" });
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Your phone number is your DollarCash ID."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            value={form.fullName}
            onChange={set("fullName")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            inputMode="tel"
            autoComplete="tel"
            placeholder="03xx xxxxxxx"
            value={form.phone}
            onChange={set("phone")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="referral">
            Referral code{" "}
            <span className="text-muted-foreground">(optional)</span>
          </Label>

          <Input
            id="referral"
            placeholder="DC1A2B3C"
            value={form.referral}
            onChange={set("referral")}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="tap h-12 w-full rounded-xl text-base"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
