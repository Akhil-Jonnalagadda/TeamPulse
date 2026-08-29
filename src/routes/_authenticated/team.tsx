import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { useApplications, useMembers, useTeams } from "@/lib/queries";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { CardSkeleton, EmptyState } from "@/components/common/States";
import { StatusBadge } from "@/components/common/Badges";
import { UserAvatar } from "@/components/common/UserAvatar";
import { FilterSelect, OptionSelect, SearchInput, Toolbar } from "@/components/common/Toolbar";
import { Progress } from "@/components/ui/progress";
import { SHIFTS } from "@/lib/constants";
import { daysAgoIso, hours, isoDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Team — TeamPulse" },
      {
        name: "description",
        content: "People, shifts, applications and today's activity across your team.",
      },
      { property: "og:title", content: "Team — TeamPulse" },
      { property: "og:description", content: "Team roster and daily activity in TeamPulse." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { role, teamId } = useCurrentUser();
  const { data: teams } = useTeams();
  const [teamFilter, setTeamFilter] = useState<string>(role === "manager" ? "all" : (teamId ?? "all"));
  const { data: members } = useMembers(teamFilter === "all" ? null : teamFilter);
  const { data: apps } = useApplications();
  const [search, setSearch] = useState("");
  const [shift, setShift] = useState("all");
  const today = isoDate();

  const { data: activity, isLoading } = useQuery({
    queryKey: ["team-activity", teamFilter],
    queryFn: async () => {
      const since = daysAgoIso(6);
      const { data: rows } = await supabase
        .from("daily_updates")
        .select("user_id, work_date, total_hours, submission_status")
        .gte("work_date", since);
      return rows ?? [];
    },
  });

  const appName = useMemo(() => new Map((apps ?? []).map((a) => [a.id, a.name])), [apps]);
  const roster = (members ?? []).filter((m) => {
    if (shift !== "all" && m.shift !== shift) return false;
    if (search && !`${m.full_name} ${m.email} ${m.employee_id ?? ""}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const todayRows = (activity ?? []).filter((a) => a.work_date === today);
  const submittedIds = new Set(
    todayRows.filter((a) => a.submission_status !== "draft").map((a) => a.user_id),
  );
  const compliance = roster.length
    ? Math.round((roster.filter((m) => submittedIds.has(m.id)).length / roster.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Team" description={`${roster.length} people`} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Members" value={roster.length} icon={Users} loading={isLoading} />
        <StatCard
          label="Submitted today"
          value={`${compliance}%`}
          icon={Users}
          tone={compliance >= 80 ? "success" : "warning"}
          loading={isLoading}
        />
        <StatCard
          label="Hours today"
          value={hours(todayRows.reduce((s, a) => s + Number(a.total_hours ?? 0), 0))}
          icon={Users}
          loading={isLoading}
        />
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search people…" />
        <FilterSelect value={shift} onChange={setShift} options={SHIFTS} allLabel="All shifts" width="w-[150px]" />
        {role === "manager" && (
          <OptionSelect
            value={teamFilter}
            onChange={setTeamFilter}
            options={(teams ?? []).map((t) => ({ id: t.id, name: t.name }))}
            allLabel="All teams"
          />
        )}
      </Toolbar>

      <SectionCard title="Roster" description="Weekly activity" bodyClassName="p-0">
        {isLoading ? (
          <div className="p-4">
            <CardSkeleton rows={6} />
          </div>
        ) : roster.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={Users} title="No people match" description="Try clearing the filters." />
          </div>
        ) : (
          <ul className="divide-y">
            {roster.map((m) => {
              const rows = (activity ?? []).filter((a) => a.user_id === m.id);
              const weekHours = rows.reduce((s, a) => s + Number(a.total_hours ?? 0), 0);
              const submittedDays = rows.filter((a) => a.submission_status !== "draft").length;
              return (
                <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <UserAvatar
                    name={m.full_name}
                    src={m.avatar_url}
                    presence={submittedIds.has(m.id) ? "online" : "offline"}
                  />
                  <div className="min-w-[180px] flex-1">
                    <p className="truncate text-sm font-medium">{m.full_name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {m.employee_id ?? "—"} · {m.shift} shift ·{" "}
                      {appName.get(m.primary_application_id ?? "") ?? "No primary app"}
                    </p>
                  </div>
                  <div className="w-32">
                    <Progress value={(submittedDays / 7) * 100} />
                    <p className="text-muted-foreground mt-1 text-[11px]">{submittedDays}/7 days</p>
                  </div>
                  <span className="tabular text-sm font-medium">{hours(weekHours)}</span>
                  <StatusBadge status={submittedIds.has(m.id) ? "submitted" : "draft"} />
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
