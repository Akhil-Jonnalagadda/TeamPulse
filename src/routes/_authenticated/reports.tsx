import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { useApplications, useMembers, useTeams } from "@/lib/queries";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { EmptyState, CardSkeleton } from "@/components/common/States";
import { OptionSelect, RangeSelect, Toolbar } from "@/components/common/Toolbar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { daysAgoIso, downloadCsv, hours } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — TeamPulse" },
      {
        name: "description",
        content: "Build and export productivity, incident and compliance reports as CSV.",
      },
      { property: "og:title", content: "Reports — TeamPulse" },
      { property: "og:description", content: "Operational reporting and CSV export in TeamPulse." },
    ],
  }),
  component: ReportsPage,
});

type ReportKind = "productivity" | "incidents" | "compliance";

function ReportsPage() {
  const { role, teamId } = useCurrentUser();
  const { data: teams } = useTeams();
  const { data: apps } = useApplications();
  const [team, setTeam] = useState<string>(role === "manager" ? "all" : (teamId ?? "all"));
  const { data: members } = useMembers(team === "all" ? null : team);
  const [kind, setKind] = useState<ReportKind>("productivity");
  const [range, setRange] = useState("30");
  const since = daysAgoIso(Number(range) - 1);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", team, range],
    queryFn: async () => {
      const [updates, incidents] = await Promise.all([
        supabase
          .from("daily_updates")
          .select(
            "user_id, team_id, work_date, total_hours, productive_hours, support_hours, incident_hours, meeting_hours, submission_status",
          )
          .gte("work_date", since),
        supabase
          .from("incidents")
          .select("incident_number, title, severity, status, application_id, user_id, team_id, work_date, duration_minutes")
          .gte("work_date", since),
      ]);
      return { updates: updates.data ?? [], incidents: incidents.data ?? [] };
    },
  });

  const memberName = useMemo(
    () => new Map((members ?? []).map((m) => [m.id, m.full_name])),
    [members],
  );
  const appName = useMemo(() => new Map((apps ?? []).map((a) => [a.id, a.name])), [apps]);

  const inScope = <T extends { team_id?: string | null }>(rows: T[]) =>
    team === "all" ? rows : rows.filter((r) => r.team_id === team);

  const updates = inScope(data?.updates ?? []);
  const incidents = inScope(data?.incidents ?? []);

  const productivityRows = (members ?? []).map((m) => {
    const own = updates.filter((u) => u.user_id === m.id);
    const total = own.reduce((s, u) => s + Number(u.total_hours ?? 0), 0);
    const productive = own.reduce((s, u) => s + Number(u.productive_hours ?? 0), 0);
    return {
      member: m.full_name,
      days_logged: own.length,
      total_hours: Number(total.toFixed(1)),
      productive_hours: Number(productive.toFixed(1)),
      productive_share: total ? `${Math.round((productive / total) * 100)}%` : "0%",
      incidents: incidents.filter((i) => i.user_id === m.id).length,
    };
  });

  const incidentRows = incidents.map((i) => ({
    number: i.incident_number,
    title: i.title,
    severity: i.severity,
    status: i.status,
    application: appName.get(i.application_id ?? "") ?? "",
    owner: memberName.get(i.user_id) ?? "",
    date: i.work_date,
    duration_minutes: i.duration_minutes,
  }));

  const complianceRows = (members ?? []).map((m) => {
    const own = updates.filter((u) => u.user_id === m.id);
    const submitted = own.filter((u) => u.submission_status !== "draft").length;
    return {
      member: m.full_name,
      updates: own.length,
      submitted,
      drafts: own.length - submitted,
      compliance: own.length ? `${Math.round((submitted / own.length) * 100)}%` : "0%",
    };
  });

  const rows: Record<string, unknown>[] =
    kind === "productivity" ? productivityRows : kind === "incidents" ? incidentRows : complianceRows;
  const headers = rows[0] ? Object.keys(rows[0]) : [];

  const summary =
    kind === "productivity"
      ? `${hours(updates.reduce((s, u) => s + Number(u.total_hours ?? 0), 0))} logged across ${updates.length} updates`
      : kind === "incidents"
        ? `${incidents.length} incidents in range`
        : `${(members ?? []).length} people evaluated`;

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" description={summary}>
        <Button
          onClick={() => {
            if (rows.length === 0) {
              toast.error("Nothing to export for this selection");
              return;
            }
            downloadCsv(`${kind}-report-${since}.csv`, rows);
            toast.success("Report exported");
          }}
        >
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </PageHeader>

      <Toolbar>
        <Tabs value={kind} onValueChange={(v) => setKind(v as ReportKind)}>
          <TabsList>
            <TabsTrigger value="productivity">Productivity</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>
        </Tabs>
        {role === "manager" && (
          <OptionSelect
            value={team}
            onChange={setTeam}
            options={(teams ?? []).map((t) => ({ id: t.id, name: t.name }))}
            allLabel="All teams"
          />
        )}
        <RangeSelect value={range} onChange={setRange} />
      </Toolbar>

      <SectionCard title="Preview" description={`${rows.length} rows`} bodyClassName="p-0">
        {isLoading ? (
          <div className="p-4">
            <CardSkeleton rows={6} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={FileSpreadsheet} title="No data in range" description="Widen the date range or pick another team." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((h) => (
                    <TableHead key={h} className="whitespace-nowrap capitalize">
                      {h.replace(/_/g, " ")}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((r, idx) => (
                  <TableRow key={idx}>
                    {headers.map((h) => (
                      <TableCell key={h} className="whitespace-nowrap text-sm">
                        {String(r[h] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
