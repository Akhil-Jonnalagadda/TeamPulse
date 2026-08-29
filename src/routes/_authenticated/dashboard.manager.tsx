import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, BookOpen, CheckCircle2, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApplications, useMembers, useTeams } from "@/lib/queries";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { StatGridSkeleton, EmptyState } from "@/components/common/States";
import { SeverityBadge, StatusBadge } from "@/components/common/Badges";
import { ActivityFeed } from "@/components/realtime/ActivityFeed";
import { BarsChart, DonutChart, StackedAreaChart, SEVERITY_COLORS } from "@/components/charts/Charts";
import { Button } from "@/components/ui/button";
import { daysAgoIso, hours, isoDate, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/manager")({
  head: () => ({
    meta: [
      { title: "Organisation Dashboard — TeamPulse" },
      {
        name: "description",
        content:
          "Manager view: cross-team productivity, submission compliance, incident load and application health.",
      },
      { property: "og:title", content: "Organisation Dashboard — TeamPulse" },
      {
        property: "og:description",
        content: "Cross-team operational analytics in TeamPulse.",
      },
    ],
  }),
  component: ManagerDashboard,
});

function ManagerDashboard() {
  const { data: teams } = useTeams();
  const { data: members } = useMembers(null);
  const { data: apps } = useApplications();
  const today = isoDate();

  const { data, isLoading } = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: async () => {
      const since = daysAgoIso(29);
      const [updates, incidents, learnings] = await Promise.all([
        supabase
          .from("daily_updates")
          .select(
            "id, user_id, team_id, work_date, total_hours, productive_hours, support_hours, incident_hours, meeting_hours, submission_status",
          )
          .gte("work_date", since)
          .order("work_date"),
        supabase
          .from("incidents")
          .select("id, incident_number, title, severity, status, team_id, application_id, work_date, duration_minutes")
          .gte("work_date", since)
          .order("work_date", { ascending: false }),
        supabase
          .from("learnings")
          .select("id, title, category, work_date")
          .gte("work_date", since)
          .order("work_date", { ascending: false })
          .limit(6),
      ]);
      return {
        updates: updates.data ?? [],
        incidents: incidents.data ?? [],
        learnings: learnings.data ?? [],
      };
    },
  });

  const roster = members ?? [];
  const todayUpdates = (data?.updates ?? []).filter((u) => u.work_date === today);
  const submittedToday = todayUpdates.filter((u) => u.submission_status !== "draft").length;
  const compliance = roster.length ? Math.round((submittedToday / roster.length) * 100) : 0;
  const openIncidents = (data?.incidents ?? []).filter(
    (i) => i.status !== "resolved" && i.status !== "closed",
  );
  const p1p2 = (data?.incidents ?? []).filter((i) => i.severity === "P1" || i.severity === "P2");
  const totalHours = (data?.updates ?? []).reduce((s, u) => s + Number(u.total_hours ?? 0), 0);

  const byDate = new Map<string, Record<string, number>>();
  for (const u of data?.updates ?? []) {
    const b = byDate.get(u.work_date) ?? { Productive: 0, Support: 0, Incidents: 0, Meetings: 0 };
    b["Productive"] = (b["Productive"] ?? 0) + Number(u.productive_hours ?? 0);
    b["Support"] = (b["Support"] ?? 0) + Number(u.support_hours ?? 0);
    b["Incidents"] = (b["Incidents"] ?? 0) + Number(u.incident_hours ?? 0);
    b["Meetings"] = (b["Meetings"] ?? 0) + Number(u.meeting_hours ?? 0);
    byDate.set(u.work_date, b);
  }
  const trend = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, v]) => ({ label: shortDate(d), ...v }));

  const teamCompare = (teams ?? []).map((t) => {
    const teamMembers = roster.filter((m) => m.team_id === t.id);
    const teamUpdates = (data?.updates ?? []).filter((u) => u.team_id === t.id);
    const teamToday = teamUpdates.filter(
      (u) => u.work_date === today && u.submission_status !== "draft",
    ).length;
    return {
      label: t.name,
      Hours: Number(teamUpdates.reduce((s, u) => s + Number(u.total_hours ?? 0), 0).toFixed(1)),
      Incidents: (data?.incidents ?? []).filter((i) => i.team_id === t.id).length,
      members: teamMembers.length,
      compliance: teamMembers.length ? Math.round((teamToday / teamMembers.length) * 100) : 0,
    };
  });

  const sevSplit = (["P1", "P2", "P3", "P4"] as const).map((s) => ({
    name: s,
    value: (data?.incidents ?? []).filter((i) => i.severity === s).length,
  }));

  const appLoad = (apps ?? [])
    .map((a) => ({
      label: a.name,
      Incidents: (data?.incidents ?? []).filter((i) => i.application_id === a.id).length,
    }))
    .sort((a, b) => b.Incidents - a.Incidents)
    .slice(0, 8);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Organisation dashboard"
        description="Cross-team productivity and incident health over the last 30 days"
      >
        <Button asChild variant="outline">
          <Link to="/reports">Export reports</Link>
        </Button>
      </PageHeader>

      {isLoading ? (
        <StatGridSkeleton count={4} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="People"
            value={roster.length}
            icon={Users}
            hint={`${(teams ?? []).length} teams`}
          />
          <StatCard
            label="Submitted today"
            value={`${compliance}%`}
            icon={CheckCircle2}
            tone={compliance >= 80 ? "success" : "warning"}
            hint={`${submittedToday}/${roster.length} updates`}
          />
          <StatCard label="Hours logged" value={hours(totalHours)} icon={Clock} hint="last 30 days" />
          <StatCard
            label="P1/P2 incidents"
            value={p1p2.length}
            icon={Activity}
            tone={p1p2.length > 0 ? "danger" : "success"}
            hint={`${openIncidents.length} still open`}
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Organisation hours" description="Last 30 days" className="xl:col-span-2">
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
        <SectionCard title="Incident severity mix" description="Last 30 days">
          <DonutChart data={sevSplit} colors={SEVERITY_COLORS} emptyLabel="No incidents logged" />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Team comparison" description="Hours logged, last 30 days">
          <BarsChart data={teamCompare} series={[{ key: "Hours", label: "Hours" }]} />
        </SectionCard>
        <SectionCard title="Incident load by application" description="Last 30 days">
          <BarsChart data={appLoad} series={[{ key: "Incidents", label: "Incidents" }]} />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Team health"
          description="Submission compliance today"
          bodyClassName="p-0"
          className="xl:col-span-2"
        >
          {teamCompare.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={Users} title="No teams configured" />
            </div>
          ) : (
            <ul className="divide-y">
              {teamCompare.map((t) => (
                <li key={t.label} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {t.members} people · {t.Incidents} incidents · {t.Hours}h
                    </p>
                  </div>
                  <span className="tabular text-sm font-semibold">{t.compliance}%</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Live activity" description="Across all teams" bodyClassName="p-0">
          <ActivityFeed limit={20} />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Open incidents" description="Needs resolution" bodyClassName="p-0">
          {openIncidents.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={Activity} title="No open incidents" />
            </div>
          ) : (
            <ul className="divide-y">
              {openIncidents.slice(0, 8).map((i) => (
                <li key={i.id} className="flex items-center gap-3 px-4 py-2.5">
                  <SeverityBadge severity={i.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.title}</p>
                    <p className="text-muted-foreground truncate text-xs">{i.incident_number}</p>
                  </div>
                  <StatusBadge status={i.status} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Recent learnings" description="Shared knowledge" bodyClassName="p-0">
          {(data?.learnings ?? []).length === 0 ? (
            <div className="p-4">
              <EmptyState icon={BookOpen} title="No learnings shared yet" />
            </div>
          ) : (
            <ul className="divide-y">
              {(data?.learnings ?? []).map((l) => (
                <li key={l.id} className="px-4 py-2.5">
                  <p className="truncate text-sm font-medium">{l.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {l.category} · {shortDate(l.work_date)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
