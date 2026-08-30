import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ListTodo,
  OctagonAlert,
  PhoneCall,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { useRealtimeInvalidate } from "@/hooks/use-realtime";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { StatGridSkeleton, EmptyState } from "@/components/common/States";
import { PriorityBadge, SeverityBadge, StatusBadge } from "@/components/common/Badges";
import { ActivityFeed } from "@/components/realtime/ActivityFeed";
import { StackedAreaChart, DonutChart } from "@/components/charts/Charts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { daysAgoIso, greeting, hours, isoDate, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/member")({
  head: () => ({
    meta: [
      { title: "My Dashboard — TeamPulse" },
      {
        name: "description",
        content: "Your personal TeamPulse dashboard: today's tasks, hours, incidents and streak.",
      },
      { property: "og:title", content: "My Dashboard — TeamPulse" },
      { property: "og:description", content: "Track your daily productivity at a glance." },
    ],
  }),
  component: MemberDashboard,
});

function MemberDashboard() {
  const { profile, teamId } = useCurrentUser();
  const userId = profile?.id;

  useRealtimeInvalidate(
    ["daily_updates", "daily_tasks", "incidents", "calls", "learnings", "blockers", "analyses"],
    [["member-dashboard"]],
    userId ? { filter: `user_id=eq.${userId}` } : {},
  );


  const { data, isLoading } = useQuery({
    queryKey: ["member-dashboard", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const since = daysAgoIso(13);
      const [updates, tasks, incidents, calls, learnings, blockers] = await Promise.all([
        supabase
          .from("daily_updates")
          .select("id, work_date, total_hours, productive_hours, support_hours, incident_hours, meeting_hours, analysis_hours, learning_hours, submission_status")
          .eq("user_id", userId!)
          .gte("work_date", since)
          .order("work_date"),
        supabase
          .from("daily_tasks")
          .select("id, title, status, priority, category, time_spent, created_at")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false })
          .limit(60),
        supabase
          .from("incidents")
          .select("id, incident_number, title, severity, status, work_date")
          .eq("user_id", userId!)
          .gte("work_date", since)
          .order("work_date", { ascending: false }),
        supabase.from("calls").select("id, duration_minutes, work_date").eq("user_id", userId!).gte("work_date", since),
        supabase.from("learnings").select("id, title, category, work_date").eq("user_id", userId!).order("work_date", { ascending: false }).limit(5),
        supabase
          .from("blockers")
          .select("id, description, priority, status, waiting_on")
          .eq("user_id", userId!)
          .neq("status", "resolved")
          .limit(5),
      ]);
      return {
        updates: updates.data ?? [],
        tasks: tasks.data ?? [],
        incidents: incidents.data ?? [],
        calls: calls.data ?? [],
        learnings: learnings.data ?? [],
        blockers: blockers.data ?? [],
      };
    },
  });

  const today = isoDate();
  const todayUpdate = data?.updates.find((u) => u.work_date === today);
  const todayTasks = (data?.tasks ?? []).filter((t) => (t.created_at ?? "").slice(0, 10) === today);
  const doneToday = todayTasks.filter((t) => t.status === "completed").length;
  const openIncidents = (data?.incidents ?? []).filter(
    (i) => i.status !== "resolved" && i.status !== "closed",
  );

  const streak = (() => {
    const submitted = new Set(
      (data?.updates ?? []).filter((u) => u.submission_status !== "draft").map((u) => u.work_date),
    );
    let count = 0;
    for (let i = 0; i < 14; i++) {
      const d = isoDate(subDays(new Date(), i));
      if (submitted.has(d)) count++;
      else if (i > 0) break;
    }
    return count;
  })();

  const trend = (data?.updates ?? []).map((u) => ({
    label: shortDate(u.work_date),
    Productive: Number(u.productive_hours ?? 0),
    Support: Number(u.support_hours ?? 0),
    Incidents: Number(u.incident_hours ?? 0),
    Meetings: Number(u.meeting_hours ?? 0),
  }));

  const split = [
    { name: "Completed", value: todayTasks.filter((t) => t.status === "completed").length },
    { name: "In progress", value: todayTasks.filter((t) => t.status === "in_progress").length },
    { name: "Blocked", value: todayTasks.filter((t) => t.status === "blocked").length },
    { name: "Pending", value: todayTasks.filter((t) => t.status === "pending").length },
  ];

  const totalHoursToday =
    Number(todayUpdate?.productive_hours ?? 0) +
    Number(todayUpdate?.support_hours ?? 0) +
    Number(todayUpdate?.incident_hours ?? 0) +
    Number(todayUpdate?.meeting_hours ?? 0) +
    Number(todayUpdate?.analysis_hours ?? 0) +
    Number(todayUpdate?.learning_hours ?? 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${greeting()}, ${profile?.full_name.split(" ")[0] ?? "there"}`}
        description={
          todayUpdate?.submission_status && todayUpdate.submission_status !== "draft"
            ? "Today's update is submitted. Nice work."
            : "Your update for today is still a draft."
        }
      >
        <Button asChild>
          <Link to="/today">
            Open today's update <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </PageHeader>

      {isLoading ? (
        <StatGridSkeleton count={4} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Tasks today"
            value={`${doneToday}/${todayTasks.length}`}
            icon={ListTodo}
            hint="completed"
            tone="success"
          />
          <StatCard label="Hours logged" value={hours(totalHoursToday)} icon={Clock} hint="today" />
          <StatCard
            label="Open incidents"
            value={openIncidents.length}
            icon={Activity}
            tone={openIncidents.length > 0 ? "danger" : "success"}
            hint="last 14 days"
          />
          <StatCard label="Submission streak" value={`${streak}d`} icon={CheckCircle2} tone="warning" hint="consecutive days" />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Hours breakdown" description="Last 14 days" className="xl:col-span-2">
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
        <SectionCard title="Today's task split" description="Status distribution">
          <DonutChart data={split} emptyLabel="No tasks logged today" />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Today's tasks"
          description={`${doneToday} of ${todayTasks.length} complete`}
          bodyClassName="p-0"
          className="xl:col-span-2"
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/today">Edit</Link>
            </Button>
          }
        >
          {todayTasks.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={ListTodo} title="No tasks logged yet" description="Start your daily update to add tasks." />
            </div>
          ) : (
            <>
              <div className="px-4 pt-3">
                <Progress value={todayTasks.length ? (doneToday / todayTasks.length) * 100 : 0} />
              </div>
              <ul className="mt-2 divide-y">
                {todayTasks.slice(0, 8).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {t.category} · {hours(t.time_spent)}
                      </p>
                    </div>
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </SectionCard>

        <SectionCard title="Live team activity" description="Updates as they happen" bodyClassName="p-0">
          <ActivityFeed teamId={teamId} limit={20} />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Open incidents" description="Assigned to you" bodyClassName="p-0">
          {openIncidents.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={Activity} title="No open incidents" description="You're all clear right now." />
            </div>
          ) : (
            <ul className="divide-y">
              {openIncidents.slice(0, 5).map((i) => (
                <li key={i.id} className="flex items-center gap-2 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.title}</p>
                    <p className="text-muted-foreground text-xs">{i.incident_number}</p>
                  </div>
                  <SeverityBadge severity={i.severity} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Active blockers" description="Things slowing you down" bodyClassName="p-0">
          {(data?.blockers ?? []).length === 0 ? (
            <div className="p-4">
              <EmptyState icon={OctagonAlert} title="No blockers" description="Nothing is blocking your work." />
            </div>
          ) : (
            <ul className="divide-y">
              {(data?.blockers ?? []).map((b) => (
                <li key={b.id} className="flex items-center gap-2 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.description}</p>
                    <p className="text-muted-foreground text-xs">
                      {b.waiting_on ? `Waiting on ${b.waiting_on}` : "Unassigned"}
                    </p>
                  </div>
                  <PriorityBadge priority={b.priority} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Recent learning" description="Your knowledge log" bodyClassName="p-0">
          {(data?.learnings ?? []).length === 0 ? (
            <div className="p-4">
              <EmptyState icon={BookOpen} title="No learning logged" description="Capture something you learned today." />
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

      <SectionCard title="Calls this fortnight" description="Time spent in conversations">
        <div className="flex items-center gap-3">
          <span className="bg-accent text-accent-foreground grid h-10 w-10 place-items-center rounded-lg">
            <PhoneCall className="h-4 w-4" />
          </span>
          <div>
            <p className="text-2xl font-semibold">
              {Math.round((data?.calls ?? []).reduce((a, c) => a + (c.duration_minutes ?? 0), 0) / 60)}h
            </p>
            <p className="text-muted-foreground text-xs">
              across {(data?.calls ?? []).length} calls in the last 14 days
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
