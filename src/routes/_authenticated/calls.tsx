import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, PhoneCall } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { useMembers } from "@/lib/queries";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { CardSkeleton, EmptyState } from "@/components/common/States";
import { BarsChart } from "@/components/charts/Charts";
import { FilterSelect, RangeSelect, SearchInput, Toolbar } from "@/components/common/Toolbar";
import { Button } from "@/components/ui/button";
import { CALL_TYPES } from "@/lib/constants";
import { daysAgoIso, downloadCsv, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/calls")({
  head: () => ({
    meta: [
      { title: "Calls & Meetings — TeamPulse" },
      {
        name: "description",
        content: "Bridge calls, standups, client conversations and the time they consume.",
      },
      { property: "og:title", content: "Calls & Meetings — TeamPulse" },
      { property: "og:description", content: "Meeting and bridge call tracking in TeamPulse." },
    ],
  }),
  component: CallsPage,
});

function CallsPage() {
  const { profile, role, teamId } = useCurrentUser();
  const { data: members } = useMembers(role === "manager" ? null : teamId);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [range, setRange] = useState("30");
  const since = daysAgoIso(Number(range) - 1);

  const { data, isLoading } = useQuery({
    queryKey: ["calls-list", role, teamId, range],
    enabled: Boolean(profile),
    queryFn: async () => {
      let q = supabase
        .from("calls")
        .select("id, title, call_type, duration_minutes, organizer, participants, purpose, user_id, work_date")
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

  const filtered = (data ?? []).filter((c) => {
    if (type !== "all" && c.call_type !== type) return false;
    if (search && !`${c.title} ${c.organizer ?? ""}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const totalMinutes = filtered.reduce((s, c) => s + (c.duration_minutes ?? 0), 0);
  const bridges = filtered.filter((c) => c.call_type === "Incident Bridge");

  const byType = CALL_TYPES.map((t) => ({
    label: t,
    Minutes: filtered.filter((c) => c.call_type === t).reduce((s, c) => s + (c.duration_minutes ?? 0), 0),
  }))
    .filter((r) => r.Minutes > 0)
    .sort((a, b) => b.Minutes - a.Minutes);

  return (
    <div className="space-y-5">
      <PageHeader title="Calls & meetings" description={`${filtered.length} calls in the selected period`}>
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              `calls-${since}.csv`,
              filtered.map((c) => ({
                date: c.work_date,
                title: c.title,
                type: c.call_type,
                minutes: c.duration_minutes,
                organizer: c.organizer ?? "",
                owner: memberName.get(c.user_id) ?? "",
              })),
            )
          }
        >
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Calls" value={filtered.length} icon={PhoneCall} loading={isLoading} />
        <StatCard label="Time in calls" value={`${(totalMinutes / 60).toFixed(1)}h`} icon={PhoneCall} loading={isLoading} />
        <StatCard
          label="Incident bridges"
          value={bridges.length}
          icon={PhoneCall}
          tone={bridges.length ? "warning" : "success"}
          loading={isLoading}
        />
      </div>

      <SectionCard title="Time by call type" description="Minutes in the selected period">
        <BarsChart data={byType} series={[{ key: "Minutes", label: "Minutes" }]} />
      </SectionCard>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search calls…" />
        <FilterSelect value={type} onChange={setType} options={CALL_TYPES} allLabel="All types" width="w-[190px]" />
        <RangeSelect value={range} onChange={setRange} />
      </Toolbar>

      <SectionCard title="Call log" description="Newest first" bodyClassName="p-0">
        {isLoading ? (
          <div className="p-4">
            <CardSkeleton rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={PhoneCall} title="No calls logged" description="Calls added in daily updates appear here." />
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-[200px] flex-1">
                  <p className="truncate text-sm font-medium">{c.title}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {c.call_type} · {memberName.get(c.user_id) ?? "Team member"} · {shortDate(c.work_date)}
                    {c.organizer ? ` · organised by ${c.organizer}` : ""}
                  </p>
                </div>
                <span className="text-muted-foreground tabular text-xs">{c.duration_minutes}m</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
