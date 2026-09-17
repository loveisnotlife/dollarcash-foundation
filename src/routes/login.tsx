import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { isValidPhone, phoneToAuthEmail } from "@/lib/phone";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — DollarCash" },
      { name: "description", content: "Sign in to your DollarCash wallet with your phone number." },
      { property: "og:title", content: "Sign in — DollarCash" },
      { property: "og:description", content: "Access your DollarCash balance, plans and referrals." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidPhone(phone)) {
      toast.error("Enter a valid phone number");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToAuthEmail(phone),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error("Wrong phone number or password");
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with the phone number you registered with."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="font-semibold text-primary">
            Create an account
          </Link>
        </>
      }
    >
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
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="text-right">
          <Link to="/forgot-password" className="text-xs font-medium text-muted-foreground hover:text-primary">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" disabled={loading} className="tap h-12 w-full rounded-xl text-base">
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
