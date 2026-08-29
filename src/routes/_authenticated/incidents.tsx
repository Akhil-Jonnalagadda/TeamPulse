import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { useApplications, useMembers } from "@/lib/queries";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { CardSkeleton, EmptyState } from "@/components/common/States";
import { SeverityBadge, StatusBadge } from "@/components/common/Badges";
import { DonutChart, SEVERITY_COLORS, TrendLineChart } from "@/components/charts/Charts";
import { FilterSelect, OptionSelect, RangeSelect, SearchInput, Toolbar } from "@/components/common/Toolbar";
import { Button } from "@/components/ui/button";
import { INCIDENT_STATUSES, SEVERITIES } from "@/lib/constants";
import { daysAgoIso, downloadCsv, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/incidents")({
  head: () => ({
    meta: [
      { title: "Incidents — TeamPulse" },
      {
        name: "description",
        content: "Track production incidents by severity, status, application and owner.",
      },
      { property: "og:title", content: "Incidents — TeamPulse" },
      { property: "og:description", content: "Production incident tracking in TeamPulse." },
    ],
  }),
  component: IncidentsPage,
});

function IncidentsPage() {
  const { profile, role, teamId } = useCurrentUser();
  const { data: members } = useMembers(role === "manager" ? null : teamId);
  const { data: apps } = useApplications();
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [app, setApp] = useState("all");
  const [range, setRange] = useState("30");

  const since = daysAgoIso(Number(range) - 1);

  const { data, isLoading } = useQuery({
    queryKey: ["incidents-list", role, teamId, range],
    enabled: Boolean(profile),
    queryFn: async () => {
      let q = supabase
        .from("incidents")
        .select(
          "id, incident_number, title, description, severity, status, application_id, user_id, work_date, duration_minutes, bridge_required, business_impact, root_cause, resolution",
        )
        .gte("work_date", since)
        .order("work_date", { ascending: false });
      if (role === "team_member") q = q.eq("user_id", profile!.id);
      else if (role === "team_lead" && teamId) q = q.eq("team_id", teamId);
      const { data: rows, error } = await q;
      if (error) throw error;
      return rows ?? [];
    },
  });

  const memberName = useMemo(
    () => new Map((members ?? []).map((m) => [m.id, m.full_name])),
    [members],
  );
  const appName = useMemo(() => new Map((apps ?? []).map((a) => [a.id, a.name])), [apps]);

  const filtered = (data ?? []).filter((i) => {
    if (severity !== "all" && i.severity !== severity) return false;
    if (status !== "all" && i.status !== status) return false;
    if (app !== "all" && i.application_id !== app) return false;
    if (search && !`${i.incident_number} ${i.title}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const open = filtered.filter((i) => i.status !== "resolved" && i.status !== "closed");
  const p1 = filtered.filter((i) => i.severity === "P1");
  const avgMinutes = filtered.length
    ? Math.round(filtered.reduce((s, i) => s + (i.duration_minutes ?? 0), 0) / filtered.length)
    : 0;

  const sevSplit = SEVERITIES.map((s) => ({
    name: s,
    value: filtered.filter((i) => i.severity === s).length,
  }));

  const byDate = new Map<string, number>();
  for (const i of filtered) byDate.set(i.work_date, (byDate.get(i.work_date) ?? 0) + 1);
  const trend = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, count]) => ({ label: shortDate(d), Incidents: count }));

  return (
    <div className="space-y-5">
      <PageHeader title="Incidents" description={`${filtered.length} incidents in the selected period`}>
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              `incidents-${since}.csv`,
              filtered.map((i) => ({
                number: i.incident_number,
                title: i.title,
                severity: i.severity,
                status: i.status,
                application: appName.get(i.application_id ?? "") ?? "",
                owner: memberName.get(i.user_id) ?? "",
                date: i.work_date,
                duration_minutes: i.duration_minutes,
              })),
            )
          }
        >
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={filtered.length} icon={Activity} loading={isLoading} />
        <StatCard label="Open" value={open.length} icon={Activity} tone={open.length ? "danger" : "success"} loading={isLoading} />
        <StatCard label="P1 critical" value={p1.length} icon={Activity} tone={p1.length ? "danger" : "success"} loading={isLoading} />
        <StatCard label="Avg duration" value={`${avgMinutes}m`} icon={Activity} loading={isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Incident volume" description="Per day" className="lg:col-span-2">
          <TrendLineChart data={trend} series={[{ key: "Incidents", label: "Incidents" }]} />
        </SectionCard>
        <SectionCard title="Severity mix" description="Selected period">
          <DonutChart data={sevSplit} colors={SEVERITY_COLORS} emptyLabel="No incidents" />
        </SectionCard>
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by number or title…" />
        <FilterSelect value={severity} onChange={setSeverity} options={SEVERITIES} allLabel="All severities" width="w-[150px]" />
        <FilterSelect value={status} onChange={setStatus} options={INCIDENT_STATUSES} allLabel="All statuses" />
        <OptionSelect
          value={app}
          onChange={setApp}
          options={(apps ?? []).map((a) => ({ id: a.id, name: a.name }))}
          allLabel="All applications"
        />
        <RangeSelect value={range} onChange={setRange} />
      </Toolbar>

      <SectionCard title="Incident log" description="Newest first" bodyClassName="p-0">
        {isLoading ? (
          <div className="p-4">
            <CardSkeleton rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={Activity} title="No incidents match" description="Adjust the filters or widen the date range." />
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <SeverityBadge severity={i.severity} />
                <div className="min-w-[200px] flex-1">
                  <p className="truncate text-sm font-medium">{i.title}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {i.incident_number} · {appName.get(i.application_id ?? "") ?? "Unassigned app"} ·{" "}
                    {memberName.get(i.user_id) ?? "Team member"} · {shortDate(i.work_date)}
                  </p>
                </div>
                <span className="text-muted-foreground tabular text-xs">{i.duration_minutes}m</span>
                <StatusBadge status={i.status} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
