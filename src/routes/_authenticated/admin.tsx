import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Plus, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { useApplications, useTeams } from "@/lib/queries";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { CardSkeleton, EmptyState } from "@/components/common/States";
import { RoleBadge } from "@/components/common/Badges";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CRITICALITIES, SUPPORT_HOURS } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration — TeamPulse" },
      { name: "description", content: "Manage teams, supported applications and people across the organisation." },
      { property: "og:title", content: "Administration — TeamPulse" },
      { property: "og:description", content: "Manage teams, applications and people in TeamPulse." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { role } = useCurrentUser();
  const qc = useQueryClient();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: apps } = useApplications();
  const [teamOpen, setTeamOpen] = useState(false);
  const [appOpen, setAppOpen] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: "", description: "", working_hours: "8" });
  const [appForm, setAppForm] = useState({
    name: "",
    description: "",
    criticality: "medium",
    support_hours: "24x7",
    owner_team_id: "none",
  });

  const { data: people } = useQuery({
    queryKey: ["admin-people"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      return { profiles: profiles ?? [], roles: roles ?? [] };
    },
  });

  const roleOf = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of people?.roles ?? []) m.set(r.user_id, r.role);
    return m;
  }, [people]);

  const createTeam = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("teams").insert({
        name: teamForm.name.trim(),
        description: teamForm.description.trim() || null,
        working_hours: Number(teamForm.working_hours) || 8,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Team created");
      setTeamOpen(false);
      setTeamForm({ name: "", description: "", working_hours: "8" });
      void qc.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createApp = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("applications").insert({
        name: appForm.name.trim(),
        description: appForm.description.trim() || null,
        criticality: appForm.criticality,
        support_hours: appForm.support_hours,
        owner_team_id: appForm.owner_team_id === "none" ? null : appForm.owner_team_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application added");
      setAppOpen(false);
      setAppForm({ name: "", description: "", criticality: "medium", support_hours: "24x7", owner_team_id: "none" });
      void qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (role !== "manager") {
    return (
      <div className="space-y-5">
        <PageHeader title="Administration" description="Manager access required" />
        <SectionCard title="Restricted" description="You do not have access">
          <EmptyState
            icon={ShieldAlert}
            title="Manager access required"
            description="Ask a manager to grant you the manager role to configure teams and applications."
          />
        </SectionCard>
      </div>
    );
  }

  const teamName = new Map((teams ?? []).map((t) => [t.id, t.name]));

  return (
    <div className="space-y-5">
      <PageHeader title="Administration" description="Teams, applications and people" />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Teams" value={(teams ?? []).length} icon={Users} loading={teamsLoading} />
        <StatCard label="Applications" value={(apps ?? []).length} icon={Boxes} />
        <StatCard label="People" value={(people?.profiles ?? []).length} icon={Users} />
      </div>

      <Tabs defaultValue="teams">
        <TabsList>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="apps">Applications</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="mt-4">
          <SectionCard
            title="Teams"
            description="Working hours and cut-off"
            action={
              <Button size="sm" onClick={() => setTeamOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New team
              </Button>
            }
            bodyClassName="p-0"
          >
            {teamsLoading ? (
              <div className="p-4">
                <CardSkeleton rows={3} />
              </div>
            ) : (
              <ul className="divide-y">
                {(teams ?? []).map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-[200px] flex-1">
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-muted-foreground text-xs">{t.description ?? "No description"}</p>
                    </div>
                    <Badge variant="secondary">{t.working_hours}h day</Badge>
                    <Badge variant="outline">Cut-off {String(t.cutoff_time).slice(0, 5)}</Badge>
                    <span className="text-muted-foreground text-xs">
                      {(people?.profiles ?? []).filter((p) => p.team_id === t.id).length} members
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="apps" className="mt-4">
          <SectionCard
            title="Applications"
            description="Supported estate"
            action={
              <Button size="sm" onClick={() => setAppOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New application
              </Button>
            }
            bodyClassName="p-0"
          >
            <ul className="divide-y">
              {(apps ?? []).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-[200px] flex-1">
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {teamName.get(a.owner_team_id ?? "") ?? "Unassigned"} · {a.support_hours}
                    </p>
                  </div>
                  <Badge variant={a.criticality === "critical" ? "destructive" : "secondary"}>
                    {a.criticality}
                  </Badge>
                </li>
              ))}
            </ul>
          </SectionCard>
        </TabsContent>

        <TabsContent value="people" className="mt-4">
          <SectionCard title="People" description="Roles and team assignment" bodyClassName="p-0">
            <ul className="divide-y">
              {(people?.profiles ?? []).map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <UserAvatar name={p.full_name} src={p.avatar_url} />
                  <div className="min-w-[200px] flex-1">
                    <p className="text-sm font-medium">{p.full_name}</p>
                    <p className="text-muted-foreground text-xs">{p.email}</p>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {teamName.get(p.team_id ?? "") ?? "Unassigned"}
                  </span>
                  <RoleBadge role={(roleOf.get(p.id) ?? "team_member") as "manager" | "team_lead" | "team_member"} />
                </li>
              ))}
            </ul>
          </SectionCard>
        </TabsContent>
      </Tabs>

      <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New team</DialogTitle>
            <DialogDescription>Create a support team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="team-name">Name</Label>
              <Input id="team-name" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="team-desc">Description</Label>
              <Textarea
                id="team-desc"
                value={teamForm.description}
                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="team-hours">Working hours / day</Label>
              <Input
                id="team-hours"
                type="number"
                value={teamForm.working_hours}
                onChange={(e) => setTeamForm({ ...teamForm, working_hours: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createTeam.mutate()} disabled={!teamForm.name.trim() || createTeam.isPending}>
              Create team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={appOpen} onOpenChange={setAppOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New application</DialogTitle>
            <DialogDescription>Add a supported application.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="app-name">Name</Label>
              <Input id="app-name" value={appForm.name} onChange={(e) => setAppForm({ ...appForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="app-desc">Description</Label>
              <Textarea
                id="app-desc"
                value={appForm.description}
                onChange={(e) => setAppForm({ ...appForm, description: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Criticality</Label>
                <Select value={appForm.criticality} onValueChange={(v) => setAppForm({ ...appForm, criticality: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRITICALITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Support hours</Label>
                <Select value={appForm.support_hours} onValueChange={(v) => setAppForm({ ...appForm, support_hours: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORT_HOURS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Owner team</Label>
              <Select value={appForm.owner_team_id} onValueChange={(v) => setAppForm({ ...appForm, owner_team_id: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {(teams ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createApp.mutate()} disabled={!appForm.name.trim() || createApp.isPending}>
              Add application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
