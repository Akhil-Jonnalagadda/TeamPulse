import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { useApplications, useTeams } from "@/lib/queries";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { UserAvatar } from "@/components/common/UserAvatar";
import { RoleBadge } from "@/components/common/Badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SHIFTS } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TeamPulse" },
      { name: "description", content: "Update your profile, shift, primary application and appearance." },
      { property: "og:title", content: "Settings — TeamPulse" },
      { property: "og:description", content: "Manage your TeamPulse profile and preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, role, refetch } = useCurrentUser();
  const { data: apps } = useApplications();
  const { data: teams } = useTeams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [shift, setShift] = useState("General");
  const [primaryApp, setPrimaryApp] = useState("none");
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name);
    setEmployeeId(profile.employee_id ?? "");
    setShift(profile.shift);
    setPrimaryApp(profile.primary_application_id ?? "none");
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          employee_id: employeeId.trim() || null,
          shift,
          primary_application_id: primaryApp === "none" ? null : primaryApp,
          timezone,
        })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      void refetch();
      void qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const teamName = teams?.find((t) => t.id === profile?.team_id)?.name ?? "Unassigned";

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Your profile, shift and appearance" />

      <SectionCard title="Profile" description="Visible to your team">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <UserAvatar name={profile?.full_name ?? "?"} src={profile?.avatar_url ?? null} size="lg" />
            <div>
              <p className="text-sm font-medium">{profile?.email}</p>
              <div className="mt-1 flex items-center gap-2">
                {role && <RoleBadge role={role} />}
                <span className="text-muted-foreground text-xs">{teamName}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="full-name">Full name</Label>
              <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employee-id">Employee ID</Label>
              <Input id="employee-id" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Shift</Label>
              <Select value={shift} onValueChange={setShift}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Primary application</Label>
              <Select value={primaryApp} onValueChange={setPrimaryApp}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(apps ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tz">Timezone</Label>
              <Input id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </div>
          </div>

          <div>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !fullName.trim()}>
              <Save className="mr-2 h-4 w-4" /> Save changes
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Appearance" description="Light, dark or system theme">
        <ThemeToggle />
      </SectionCard>

      <SectionCard title="Session" description="Sign out of this device">
        <Button
          variant="outline"
          onClick={async () => {
            await supabase.auth.signOut();
            qc.clear();
            void navigate({ to: "/auth" });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </SectionCard>
    </div>
  );
}
