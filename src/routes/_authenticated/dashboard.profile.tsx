import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  head: () => ({
    meta: [
      { title: "Profile — DollarCash" },
      { name: "description", content: "Manage your DollarCash account details." },
      { property: "og:title", content: "Profile — DollarCash" },
      { property: "og:description", content: "View and update your DollarCash account details." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() } as never)
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error("Could not save your changes");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile updated");
  }

  const locked = [
    { label: "Phone number", value: profile?.phone ?? "—" },
    { label: "Account role", value: profile?.role ?? "—" },
    { label: "Referral code", value: profile?.referral_code ?? "—" },
    { label: "Referred by", value: profile?.referred_by ?? "None" },
    { label: "Account status", value: profile?.is_banned ? "Suspended" : "Active" },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-rise">
        <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your account details and security info.</p>
      </div>

      <form onSubmit={save} className="rounded-2xl border border-border/70 bg-card p-5 animate-fade">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <Button type="submit" disabled={saving} className="tap mt-4 h-11 w-full rounded-xl sm:w-auto sm:px-8">
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
        </Button>
      </form>

      <section className="rounded-2xl border border-border/70 surface-gradient p-5 animate-fade">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-gold" />
          <p className="text-sm font-semibold text-foreground">Protected details</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          These values are managed by DollarCash and cannot be edited from your account.
        </p>
        <dl className="mt-4 divide-y divide-border/70">
          {locked.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium text-foreground">
                {label === "Account role" ? <Badge variant="secondary">{value}</Badge> : value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
