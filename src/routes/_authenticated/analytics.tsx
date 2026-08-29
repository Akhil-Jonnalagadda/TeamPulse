import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Clock, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { useApplications, useMembers, useTeams } from "@/lib/queries";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { BarsChart, DonutChart, SEVERITY_COLORS, StackedAreaChart, TrendLineChart } from "@/components/charts/Charts";
import { RangeSelect, Toolbar } from "@/components/common/Toolbar";
import { SEVERITIES } from "@/lib/constants";
import { daysAgoIso, hours, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — TeamPulse" },
      {
        name: "description",
        content: "Productivity, incident and workload trends across teams and applications.",
      },
      { property: "og:title", content: "Analytics — TeamPulse" },
      { property: "og:description", content: "Operational analytics and trends in TeamPulse." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { role, teamId } = useCurrentUser();
  const { data: teams } = useTeams();
  const { data: members } = useMembers(role === "manager" ? null : teamId);
  const { data: apps } = useApplications();
  const [range, setRange] = useState("30");
  const since = daysAgoIso(Number(range) - 1);

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", role, teamId, range],
    queryFn: async () => {
      const [updates, incidents, tasks, calls] = await Promise.all([
        supabase
          .from("daily_updates")
          .select(
            "user_id, team_id, work_date, total_hours, productive_hours, support_hours, incident_hours, meeting_hours, analysis_hours, learning_hours, submission_status",
          )
          .gte("work_date", since),
        supabase
          .from("incidents")
          .select("id, severity, status, application_id, team_id, work_date, duration_minutes")
          .gte("work_date", since),
        supabase
          .from("daily_tasks")
          .select("id, status, category, time_spent, created_at")
          .gte("created_at", `${since}T00:00:00Z`)
          .limit(2000),
        supabase.from("calls").select("id, duration_minutes, work_date").gte("work_date", since),
      ]);
      return {
        updates: updates.data ?? [],
        incidents: incidents.data ?? [],
        tasks: tasks.data ?? [],
        calls: calls.data ?? [],
      };
    },
  });

  const appName = useMemo(() => new Map((apps ?? []).map((a) => [a.id, a.name])), [apps]);

  const updates = data?.updates ?? [];
  const totalHours = updates.reduce((s, u) => s + Number(u.total_hours ?? 0), 0);
  const productive = updates.reduce((s, u) => s + Number(u.productive_hours ?? 0), 0);
  const utilisation = totalHours ? Math.round((productive / totalHours) * 100) : 0;
  const submitted = updates.filter((u) => u.submission_status !== "draft").length;
  const complianceRate = updates.length ? Math.round((submitted / updates.length) * 100) : 0;

  const byDate = new Map<string, Record<string, number>>();
  for (const u of updates) {
    const b = byDate.get(u.work_date) ?? { Productive: 0, Support: 0, Incidents: 0, Meetings: 0, Analysis: 0, Learning: 0 };
    b["Productive"] = (b["Productive"] ?? 0) + Number(u.productive_hours ?? 0);
    b["Support"] = (b["Support"] ?? 0) + Number(u.support_hours ?? 0);
    b["Incidents"] = (b["Incidents"] ?? 0) + Number(u.incident_hours ?? 0);
    b["Meetings"] = (b["Meetings"] ?? 0) + Number(u.meeting_hours ?? 0);
    b["Analysis"] = (b["Analysis"] ?? 0) + Number(u.analysis_hours ?? 0);
    b["Learning"] = (b["Learning"] ?? 0) + Number(u.learning_hours ?? 0);
    byDate.set(u.work_date, b);
  }
  const hoursTrend = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, v]) => ({ label: shortDate(d), ...v }));

  const incidentByDate = new Map<string, number>();
  for (const i of data?.incidents ?? [])
    incidentByDate.set(i.work_date, (incidentByDate.get(i.work_date) ?? 0) + 1);
  const incidentTrend = [...incidentByDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, n]) => ({ label: shortDate(d), Incidents: n }));

  const sevSplit = SEVERITIES.map((s) => ({
    name: s,
    value: (data?.incidents ?? []).filter((i) => i.severity === s).length,
  }));

  const categoryTotals = new Map<string, number>();
  for (const t of data?.tasks ?? [])
    categoryTotals.set(t.category, (categoryTotals.get(t.category) ?? 0) + Number(t.time_spent ?? 0));
  const byCategory = [...categoryTotals.entries()]
    .map(([label, v]) => ({ label, Hours: Number(v.toFixed(1)) }))
    .sort((a, b) => b.Hours - a.Hours)
    .slice(0, 10);

  const teamCompare = (teams ?? []).map((t) => ({
    label: t.name,
    Hours: Number(
      updates.filter((u) => u.team_id === t.id).reduce((s, u) => s + Number(u.total_hours ?? 0), 0).toFixed(1),
    ),
    Incidents: (data?.incidents ?? []).filter((i) => i.team_id === t.id).length,
  }));

  const appLoad = (apps ?? [])
    .map((a) => ({
      label: appName.get(a.id) ?? a.name,
      Incidents: (data?.incidents ?? []).filter((i) => i.application_id === a.id).length,
    }))
    .sort((a, b) => b.Incidents - a.Incidents)
    .slice(0, 8);

  return (
    <div className="space-y-5">
      <PageHeader title="Analytics" description="Productivity and incident trends">
        <Toolbar>
          <RangeSelect value={range} onChange={setRange} />
        </Toolbar>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Hours logged" value={hours(totalHours)} icon={Clock} loading={isLoading} />
        <StatCard label="Productive share" value={`${utilisation}%`} icon={TrendingUp} tone="success" loading={isLoading} />
        <StatCard label="Submission rate" value={`${complianceRate}%`} icon={Users} tone={complianceRate >= 80 ? "success" : "warning"} loading={isLoading} />
        <StatCard label="Incidents" value={(data?.incidents ?? []).length} icon={Activity} tone="danger" loading={isLoading} />
      </div>

      <SectionCard title="Where time goes" description="Hours by category per day">
        <StackedAreaChart
          height={320}
          data={hoursTrend}
          series={[
            { key: "Productive", label: "Productive" },
            { key: "Support", label: "Support" },
            { key: "Incidents", label: "Incidents" },
            { key: "Meetings", label: "Meetings" },
            { key: "Analysis", label: "Analysis" },
            { key: "Learning", label: "Learning" },
          ]}
        />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Incident volume" description="Per day" className="lg:col-span-2">
          <TrendLineChart data={incidentTrend} series={[{ key: "Incidents", label: "Incidents" }]} />
        </SectionCard>
        <SectionCard title="Severity mix" description="Selected period">
          <DonutChart data={sevSplit} colors={SEVERITY_COLORS} emptyLabel="No incidents" />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Effort by task category" description="Hours logged">
          <BarsChart data={byCategory} series={[{ key: "Hours", label: "Hours" }]} />
        </SectionCard>
        <SectionCard title="Incident load by application" description="Selected period">
          <BarsChart data={appLoad} series={[{ key: "Incidents", label: "Incidents" }]} />
        </SectionCard>
      </div>

      {role === "manager" && (
        <SectionCard title="Team comparison" description="Hours and incidents">
          <BarsChart
            layout="horizontal"
            data={teamCompare}
            series={[
              { key: "Hours", label: "Hours" },
              { key: "Incidents", label: "Incidents" },
            ]}
          />
        </SectionCard>
      )}

      <p className="text-muted-foreground text-xs">
        Based on {updates.length} daily updates from {(members ?? []).length} people.
      </p>
    </div>
  );
}
