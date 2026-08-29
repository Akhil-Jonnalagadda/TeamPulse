import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Clock, OctagonAlert, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { useMembers } from "@/lib/queries";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { StatGridSkeleton, EmptyState } from "@/components/common/States";
import { SeverityBadge, StatusBadge } from "@/components/common/Badges";
import { UserAvatar } from "@/components/common/UserAvatar";
import { ActivityFeed } from "@/components/realtime/ActivityFeed";
import { BarsChart, StackedAreaChart, DonutChart } from "@/components/charts/Charts";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { daysAgoIso, hours, isoDate, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/lead")({
  head: () => ({
    meta: [
      { title: "Team Dashboard — TeamPulse" },
      {
        name: "description",
        content:
          "Team Lead view: who has submitted today, team hours, open incidents and blockers in real time.",
      },
      { property: "og:title", content: "Team Dashboard — TeamPulse" },
      {
        property: "og:description",
        content: "Live operational view of your team's day in TeamPulse.",
      },
    ],
  }),
  component: LeadDashboard,
});

function LeadDashboard() {
  const { teamId } = useCurrentUser();
  const { data: members } = useMembers(teamId);
  const today = isoDate();

  const { data, isLoading } = useQuery({
    queryKey: ["lead-dashboard", teamId],
    enabled: Boolean(teamId),
    queryFn: async () => {
      const since = daysAgoIso(13);
      const [updates, incidents, blockers, tasks] = await Promise.all([
        supabase
          .from("daily_updates")
          .select(
            "id, user_id, work_date, total_hours, productive_hours, support_hours, incident_hours, meeting_hours, analysis_hours, learning_hours, submission_status",
          )
          .eq("team_id", teamId!)
          .gte("work_date", since)
          .order("work_date"),
        supabase
          .from("incidents")
          .select("id, incident_number, title, severity, status, user_id, work_date")
          .eq("team_id", teamId!)
          .gte("work_date", since)
          .order("work_date", { ascending: false }),
        supabase
          .from("blockers")
          .select("id, description, priority, status, waiting_on, user_id")
          .eq("team_id", teamId!)
          .neq("status", "resolved")
          .limit(8),
        supabase
          .from("daily_tasks")
          .select("id, status, user_id, time_spent, created_at")
          .gte("created_at", `${since}T00:00:00Z`)
          .limit(1000),
      ]);
      return {
        updates: updates.data ?? [],
        incidents: incidents.data ?? [],
        blockers: blockers.data ?? [],
        tasks: tasks.data ?? [],
      };
    },
  });

  const roster = members ?? [];
  const todayUpdates = (data?.updates ?? []).filter((u) => u.work_date === today);
  const submitted = todayUpdates.filter((u) => u.submission_status !== "draft");
  const submittedIds = new Set(submitted.map((u) => u.user_id));
  const pending = roster.filter((m) => !submittedIds.has(m.id));
  const openIncidents = (data?.incidents ?? []).filter(
    (i) => i.status !== "resolved" && i.status !== "closed",
  );
  const teamHoursToday = todayUpdates.reduce((sum, u) => sum + Number(u.total_hours ?? 0), 0);
  const compliance = roster.length ? Math.round((submitted.length / roster.length) * 100) : 0;

  const byDate = new Map<string, Record<string, number>>();
  for (const u of data?.updates ?? []) {
    const bucket = byDate.get(u.work_date) ?? {
      Productive: 0,
      Support: 0,
      Incidents: 0,
      Meetings: 0,
    };
    bucket["Productive"] = (bucket["Productive"] ?? 0) + Number(u.productive_hours ?? 0);
    bucket["Support"] = (bucket["Support"] ?? 0) + Number(u.support_hours ?? 0);
    bucket["Incidents"] = (bucket["Incidents"] ?? 0) + Number(u.incident_hours ?? 0);
    bucket["Meetings"] = (bucket["Meetings"] ?? 0) + Number(u.meeting_hours ?? 0);
    byDate.set(u.work_date, bucket);
  }
  const trend = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ label: shortDate(date), ...v }));

  const perMember = roster
    .map((m) => {
      const memberUpdates = (data?.updates ?? []).filter((u) => u.user_id === m.id);
      return {
        label: m.full_name.split(" ")[0] ?? m.full_name,
        Hours: Number(
          memberUpdates.reduce((s, u) => s + Number(u.total_hours ?? 0), 0).toFixed(1),
        ),
      };
    })
    .sort((a, b) => b.Hours - a.Hours)
    .slice(0, 10);

  const sevSplit = (["P1", "P2", "P3", "P4"] as const).map((s) => ({
    name: s,
    value: (data?.incidents ?? []).filter((i) => i.severity === s).length,
  }));

  const nameOf = (id: string) => roster.find((m) => m.id === id)?.full_name ?? "Team member";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team dashboard"
        description={`${submitted.length} of ${roster.length} updates submitted today`}
      >
        <Button asChild variant="outline">
          <Link to="/updates">Review updates</Link>
        </Button>
      </PageHeader>

      {isLoading ? (
        <StatGridSkeleton count={4} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Team size" value={roster.length} icon={Users} hint="active members" />
          <StatCard
            label="Submitted today"
            value={`${compliance}%`}
            icon={CheckCircle2}
            tone={compliance >= 80 ? "success" : "warning"}
            hint={`${pending.length} pending`}
          />
          <StatCard label="Team hours today" value={hours(teamHoursToday)} icon={Clock} />
          <StatCard
            label="Open incidents"
            value={openIncidents.length}
            icon={Activity}
            tone={openIncidents.length > 0 ? "danger" : "success"}
            hint="last 14 days"
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Team hours" description="Last 14 days" className="xl:col-span-2">
          <StackedAreaChart
            data={trend}
            series={[
              { key: "Productive", label: "Productive" },
              { key: "Support", label: "Support" },
              { key: "Incidents", label: "Incidents" },
              { key: "Meetings", label: "Meetings" },
            ]}
          />
        </SectionCard>
        <SectionCard title="Incidents by severity" description="Last 14 days">
          <DonutChart data={sevSplit} emptyLabel="No incidents logged" />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Submission status"
          description="Today"
          bodyClassName="p-0"
          className="xl:col-span-2"
        >
          <div className="px-4 pt-3">
            <Progress value={compliance} />
          </div>
          {roster.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={Users} title="No team members yet" />
            </div>
          ) : (
            <ul className="mt-2 divide-y">
              {roster.slice(0, 10).map((m) => {
                const update = todayUpdates.find((u) => u.user_id === m.id);
                return (
                  <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                    <UserAvatar name={m.full_name} src={m.avatar_url} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.full_name}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {m.shift} shift · {hours(update?.total_hours ?? 0)}
                      </p>
                    </div>
                    <StatusBadge status={update?.submission_status ?? "draft"} />
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Live team activity" description="Updates as they happen" bodyClassName="p-0">
          <ActivityFeed teamId={teamId} limit={20} />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Hours by member" description="Last 14 days" className="lg:col-span-2">
          <BarsChart data={perMember} series={[{ key: "Hours", label: "Hours" }]} />
        </SectionCard>

        <SectionCard title="Active blockers" description="Needs your attention" bodyClassName="p-0">
          {(data?.blockers ?? []).length === 0 ? (
            <div className="p-4">
              <EmptyState icon={OctagonAlert} title="No active blockers" description="The team is unblocked." />
            </div>
          ) : (
            <ul className="divide-y">
              {(data?.blockers ?? []).map((b) => (
                <li key={b.id} className="px-4 py-2.5">
                  <p className="truncate text-sm font-medium">{b.description}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {nameOf(b.user_id)}
                    {b.waiting_on ? ` · waiting on ${b.waiting_on}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Open incidents" description="Across the team" bodyClassName="p-0">
        {openIncidents.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={Activity} title="No open incidents" description="Everything is stable right now." />
          </div>
        ) : (
          <ul className="divide-y">
            {openIncidents.slice(0, 8).map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-4 py-2.5">
                <SeverityBadge severity={i.severity} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.title}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {i.incident_number} · {nameOf(i.user_id)}
                  </p>
                </div>
                <StatusBadge status={i.status} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
