import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  BookOpen,
  CalendarCheck,
  CheckCircle2,

  FlaskConical,
  ListTodo,
  Loader2,
  OctagonAlert,
  PhoneCall,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { useApplications } from "@/lib/queries";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { PriorityBadge, SeverityBadge, StatusBadge } from "@/components/common/Badges";
import { EmptyState } from "@/components/common/States";
import { EntityDialog, type FieldSpec, type FormValues } from "@/components/forms/EntityDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  ANALYSIS_STATUSES,
  CALL_TYPES,
  INCIDENT_STATUSES,
  LEARNING_CATEGORIES,
  LOCATIONS,
  PRIORITIES,
  SEVERITIES,
  SHIFTS,
  TASK_CATEGORIES,
  TASK_STATUSES,
} from "@/lib/constants";
import { hours, isoDate, prettyDate, titleCase } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({
    meta: [
      { title: "Today's Update — TeamPulse" },
      {
        name: "description",
        content: "Log today's tasks, incidents, calls, analysis, learning and blockers in TeamPulse.",
      },
      { property: "og:title", content: "Today's Update — TeamPulse" },
      { property: "og:description", content: "Submit your structured daily work update." },
    ],
  }),
  component: TodayPage,
});

const opts = (list: readonly string[], label?: (v: string) => string) =>
  list.map((v) => ({ value: v, label: label ? label(v) : v }));

interface UpdateRow {
  id: string;
  work_date: string;
  shift: string;
  location: string;
  summary: string | null;
  submission_status: string;
  submitted_at: string | null;
  primary_application_id: string | null;
  productive_hours: number;
  support_hours: number;
  incident_hours: number;
  meeting_hours: number;
  analysis_hours: number;
  learning_hours: number;
  total_hours: number;
}

function TodayPage() {
  const { profile, teamId } = useCurrentUser();
  const queryClient = useQueryClient();
  const { data: apps } = useApplications();
  const [workDate, setWorkDate] = useState(isoDate());

  const userId = profile?.id;
  const key = ["daily-update", userId, workDate];

  const { data: update, isLoading } = useQuery({
    queryKey: key,
    enabled: Boolean(userId),
    queryFn: async (): Promise<UpdateRow | null> => {
      const { data, error } = await supabase
        .from("daily_updates")
        .select("*")
        .eq("user_id", userId!)
        .eq("work_date", workDate)
        .maybeSingle();
      if (error) throw error;
      return (data as UpdateRow) ?? null;
    },
  });

  const ensureUpdate = useMutation({
    mutationFn: async (): Promise<UpdateRow> => {
      if (update) return update;
      const { data, error } = await supabase
        .from("daily_updates")
        .insert({
          user_id: userId!,
          team_id: teamId,
          work_date: workDate,
          shift: profile?.shift ?? "General",
          primary_application_id: profile?.primary_application_id ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as UpdateRow;
    },
    onSuccess: (row) => queryClient.setQueryData(key, row),
  });

  const saveUpdate = useMutation({
    mutationFn: async (patch: Partial<UpdateRow>) => {
      const base = update ?? (await ensureUpdate.mutateAsync());
      const { data, error } = await supabase
        .from("daily_updates")
        .update(patch)
        .eq("id", base.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as UpdateRow;
    },
    onSuccess: (row) => queryClient.setQueryData(key, row),
    onError: (e) => toast.error("Could not save", { description: (e as Error).message }),
  });

  const submit = useMutation({
    mutationFn: async () => {
      const base = update ?? (await ensureUpdate.mutateAsync());
      const { error } = await supabase
        .from("daily_updates")
        .update({ submission_status: "submitted", submitted_at: new Date().toISOString() })
        .eq("id", base.id);
      if (error) throw error;
      await supabase.from("activity_logs").insert({
        actor_id: userId!,
        team_id: teamId,
        action: "submitted_update",
        entity_type: "daily_update",
        entity_id: base.id,
        description: `submitted the daily update for ${prettyDate(workDate)}`,
      });
    },
    onSuccess: () => {
      toast.success("Daily update submitted");
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error("Submission failed", { description: (e as Error).message }),
  });

  const appOptions = useMemo(
    () => [{ value: "none", label: "Not application specific" }, ...(apps ?? []).map((a) => ({ value: a.id, label: a.name }))],
    [apps],
  );

  const updateId = update?.id ?? null;
  const submitted = update?.submission_status === "submitted" || update?.submission_status === "reviewed";

  const totals =
    (update?.productive_hours ?? 0) +
    (update?.support_hours ?? 0) +
    (update?.incident_hours ?? 0) +
    (update?.meeting_hours ?? 0) +
    (update?.analysis_hours ?? 0) +
    (update?.learning_hours ?? 0);

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-20 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading today's update…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Today's Update"
        description={`${prettyDate(workDate)} · ${submitted ? "Submitted" : "Draft in progress"}`}
      >
        <Input
          type="date"
          value={workDate}
          max={isoDate()}
          onChange={(e) => setWorkDate(e.target.value || isoDate())}
          className="w-40"
          aria-label="Work date"
        />
        <Button onClick={() => submit.mutate()} disabled={submit.isPending || submitted}>
          {submit.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : submitted ? (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {submitted ? "Submitted" : "Submit update"}
        </Button>
      </PageHeader>

      <SectionCard
        title="Shift overview"
        description="Where you worked and how the day was split"
        action={
          <span className="text-muted-foreground text-xs">
            {hours(totals)} logged {totals > 12 && "· check your totals"}
          </span>
        }
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Shift</Label>
            <Select
              value={update?.shift ?? profile?.shift ?? "General"}
              onValueChange={(v) => saveUpdate.mutate({ shift: v })}
            >
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
            <Label>Work location</Label>
            <Select
              value={update?.location ?? "Office"}
              onValueChange={(v) => saveUpdate.mutate({ location: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Primary application</Label>
            <Select
              value={update?.primary_application_id ?? "none"}
              onValueChange={(v) =>
                saveUpdate.mutate({ primary_application_id: v === "none" ? null : v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {appOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-3">
            <Label htmlFor="summary">Day summary</Label>
            <Textarea
              id="summary"
              rows={3}
              maxLength={2000}
              className="mt-1.5"
              placeholder="Two or three lines on what mattered today…"
              defaultValue={update?.summary ?? ""}
              onBlur={(e) => saveUpdate.mutate({ summary: e.target.value.trim() || null })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:col-span-3">
            {(
              [
                ["productive_hours", "Productive"],
                ["support_hours", "Support"],
                ["incident_hours", "Incidents"],
                ["meeting_hours", "Meetings"],
                ["analysis_hours", "Analysis"],
                ["learning_hours", "Learning"],
              ] as const
            ).map(([field, label]) => (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={field}>{label} hours</Label>
                <Input
                  id={field}
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  defaultValue={update?.[field] ?? 0}
                  onBlur={(e) =>
                    saveUpdate.mutate({ [field]: Number(e.target.value) || 0 } as Partial<UpdateRow>)
                  }
                />
              </div>
            ))}
          </div>
          <div className="lg:col-span-3">
            <div className="text-muted-foreground mb-1.5 flex justify-between text-xs">
              <span>Day coverage</span>
              <span>{hours(totals)} / 8h target</span>
            </div>
            <Progress value={Math.min(100, (totals / 8) * 100)} />
          </div>
        </div>
      </SectionCard>

      <ChildSection
        title="Tasks"
        description="Everything you worked on today"
        icon={ListTodo}
        table="daily_tasks"
        updateId={updateId}
        ensure={() => ensureUpdate.mutateAsync()}
        userId={userId}
        teamId={teamId}
        workDate={workDate}
        withWorkDate={false}
        fields={[
          { name: "title", label: "Task", type: "text", required: true, maxLength: 200 },
          { name: "category", label: "Category", type: "select", options: opts(TASK_CATEGORIES) },
          { name: "application_id", label: "Application", type: "select", options: appOptions },
          { name: "ticket_number", label: "Ticket number", type: "text", maxLength: 60 },
          { name: "status", label: "Status", type: "select", options: opts(TASK_STATUSES, titleCase) },
          { name: "priority", label: "Priority", type: "select", options: opts(PRIORITIES, titleCase) },
          { name: "time_spent", label: "Hours spent", type: "number", min: 0, max: 24, step: 0.5 },
          { name: "description", label: "Details", type: "textarea", maxLength: 2000 },
        ]}
        render={(row) => (
          <>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{row.title as string}</p>
              <p className="text-muted-foreground truncate text-xs">
                {(row.category as string) ?? "Task"}
                {row.ticket_number ? ` · ${row.ticket_number as string}` : ""} ·{" "}
                {hours(row.time_spent as number)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <PriorityBadge priority={row.priority as string} />
              <StatusBadge status={row.status as string} />
            </div>
          </>
        )}
      />

      <ChildSection
        title="Incidents"
        description="Production issues you handled"
        icon={Activity}
        table="incidents"
        updateId={updateId}
        ensure={() => ensureUpdate.mutateAsync()}
        userId={userId}
        teamId={teamId}
        workDate={workDate}
        fields={[
          { name: "incident_number", label: "Incident number", type: "text", required: true, maxLength: 60 },
          { name: "title", label: "Title", type: "text", required: true, maxLength: 200 },
          { name: "application_id", label: "Application", type: "select", options: appOptions },
          { name: "severity", label: "Severity", type: "select", options: opts(SEVERITIES) },
          { name: "status", label: "Status", type: "select", options: opts(INCIDENT_STATUSES, titleCase) },
          { name: "duration_minutes", label: "Duration (min)", type: "number", min: 0, max: 2880 },
          { name: "bridge_duration", label: "Bridge time (min)", type: "number", min: 0, max: 2880 },
          { name: "bridge_required", label: "Bridge call required", type: "switch" },
          { name: "rca_required", label: "RCA required", type: "switch" },
          { name: "description", label: "What happened", type: "textarea", maxLength: 2000 },
          { name: "resolution", label: "Resolution", type: "textarea", maxLength: 2000 },
        ]}
        activity={(v) => `logged incident ${String(v.incident_number)}`}
        activityAction="incident_logged"
        render={(row) => (
          <>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {row.incident_number as string} · {row.title as string}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {(row.duration_minutes as number) || 0} min
                {row.bridge_required ? " · bridge call" : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <SeverityBadge severity={row.severity as string} />
              <StatusBadge status={row.status as string} />
            </div>
          </>
        )}
      />

      <ChildSection
        title="Calls & meetings"
        description="Bridges, standups and client conversations"
        icon={PhoneCall}
        table="calls"
        updateId={updateId}
        ensure={() => ensureUpdate.mutateAsync()}
        userId={userId}
        teamId={teamId}
        workDate={workDate}
        fields={[
          { name: "title", label: "Title", type: "text", required: true, maxLength: 200 },
          { name: "call_type", label: "Type", type: "select", options: opts(CALL_TYPES) },
          { name: "duration_minutes", label: "Duration (min)", type: "number", min: 0, max: 1440 },
          { name: "organizer", label: "Organizer", type: "text", maxLength: 120 },
          { name: "participants", label: "Participants", type: "text", maxLength: 300 },
          { name: "purpose", label: "Purpose", type: "textarea", maxLength: 1000 },
          { name: "discussion", label: "Discussion points", type: "textarea", maxLength: 2000 },
          { name: "action_items", label: "Action items", type: "textarea", maxLength: 2000 },
        ]}
        render={(row) => (
          <>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{row.title as string}</p>
              <p className="text-muted-foreground truncate text-xs">
                {(row.call_type as string) ?? "Call"} · {(row.duration_minutes as number) || 0} min
              </p>
            </div>
          </>
        )}
      />

      <ChildSection
        title="Analysis"
        description="Investigations and root-cause work"
        icon={FlaskConical}
        table="analyses"
        updateId={updateId}
        ensure={() => ensureUpdate.mutateAsync()}
        userId={userId}
        teamId={teamId}
        workDate={workDate}
        fields={[
          { name: "title", label: "Title", type: "text", required: true, maxLength: 200 },
          { name: "reference_ticket", label: "Reference ticket", type: "text", maxLength: 60 },
          { name: "application_id", label: "Application", type: "select", options: appOptions },
          { name: "status", label: "Status", type: "select", options: opts(ANALYSIS_STATUSES, titleCase) },
          { name: "problem_statement", label: "Problem statement", type: "textarea", maxLength: 2000 },
          { name: "data_reviewed", label: "Data reviewed", type: "textarea", maxLength: 2000 },
          { name: "findings", label: "Findings", type: "textarea", maxLength: 2000 },
          { name: "root_cause", label: "Root cause", type: "textarea", maxLength: 2000 },
          { name: "recommendation", label: "Recommendation", type: "textarea", maxLength: 2000 },
        ]}
        activityAction="analysis_completed"
        render={(row) => (
          <>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{row.title as string}</p>
              <p className="text-muted-foreground truncate text-xs">
                {(row.reference_ticket as string) ?? "No ticket"}
              </p>
            </div>
            <StatusBadge status={row.status as string} />
          </>
        )}
      />

      <ChildSection
        title="Learning"
        description="What you picked up today"
        icon={BookOpen}
        table="learnings"
        updateId={updateId}
        ensure={() => ensureUpdate.mutateAsync()}
        userId={userId}
        teamId={teamId}
        workDate={workDate}
        fields={[
          { name: "title", label: "What did you learn", type: "text", required: true, maxLength: 200 },
          { name: "category", label: "Category", type: "select", options: opts(LEARNING_CATEGORIES) },
          { name: "technology", label: "Technology", type: "text", maxLength: 100 },
          { name: "source", label: "Source", type: "text", maxLength: 200 },
          { name: "description", label: "Notes", type: "textarea", maxLength: 2000 },
          { name: "share_with_team", label: "Share with the team", type: "switch" },
          { name: "useful_for_team", label: "Useful for the team", type: "switch" },
        ]}
        activityAction="learning_added"
        render={(row) => (
          <>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{row.title as string}</p>
              <p className="text-muted-foreground truncate text-xs">
                {(row.category as string) ?? "Learning"}
                {row.technology ? ` · ${row.technology as string}` : ""}
              </p>
            </div>
            {Boolean(row.share_with_team) && <StatusBadge status="shared" />}
          </>
        )}
      />

      <ChildSection
        title="Blockers"
        description="Anything holding you back"
        icon={OctagonAlert}
        table="blockers"
        updateId={updateId}
        ensure={() => ensureUpdate.mutateAsync()}
        userId={userId}
        teamId={teamId}
        workDate={workDate}
        fields={[
          { name: "description", label: "Blocker", type: "text", required: true, maxLength: 300, full: true },
          { name: "priority", label: "Priority", type: "select", options: opts(PRIORITIES, titleCase) },
          { name: "waiting_on", label: "Waiting on", type: "text", maxLength: 120 },
          { name: "expected_resolution", label: "Expected resolution", type: "text", maxLength: 120 },
          { name: "impact", label: "Impact", type: "textarea", maxLength: 1000 },
        ]}
        activityAction="blocker_created"
        titleField="description"
        render={(row) => (
          <>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{row.description as string}</p>
              <p className="text-muted-foreground truncate text-xs">
                {row.waiting_on ? `Waiting on ${row.waiting_on as string}` : "Unassigned"}
              </p>
            </div>
            <PriorityBadge priority={row.priority as string} />
          </>
        )}
      />

      <ChildSection
        title="Tomorrow's plan"
        description="What you'll pick up next"
        icon={CalendarCheck}
        table="tomorrow_plans"
        updateId={updateId}
        ensure={() => ensureUpdate.mutateAsync()}
        userId={userId}
        teamId={null}
        workDate={workDate}
        withWorkDate={false}
        withTeam={false}
        titleField="task"
        fields={[
          { name: "task", label: "Planned task", type: "text", required: true, maxLength: 200, full: true },
          { name: "priority", label: "Priority", type: "select", options: opts(PRIORITIES, titleCase) },
          { name: "expected_outcome", label: "Expected outcome", type: "textarea", maxLength: 1000 },
        ]}
        render={(row) => (
          <>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{row.task as string}</p>
              <p className="text-muted-foreground truncate text-xs">
                {(row.expected_outcome as string) ?? "No stated outcome"}
              </p>
            </div>
            <PriorityBadge priority={row.priority as string} />
          </>
        )}
      />
    </div>
  );
}

type ChildTable =
  | "daily_tasks"
  | "incidents"
  | "calls"
  | "analyses"
  | "learnings"
  | "blockers"
  | "tomorrow_plans";

function ChildSection({
  title,
  description,
  icon,
  table,
  updateId,
  ensure,
  userId,
  teamId,
  workDate,
  fields,
  render,
  withWorkDate = true,
  withTeam = true,
  titleField = "title",
  activity,
  activityAction,
}: {
  title: string;
  description: string;
  icon: typeof Activity;
  table: ChildTable;
  updateId: string | null;
  ensure: () => Promise<{ id: string }>;
  userId: string | undefined;
  teamId: string | null;
  workDate: string;
  fields: FieldSpec[];
  render: (row: Record<string, unknown>) => React.ReactNode;
  withWorkDate?: boolean;
  withTeam?: boolean;
  titleField?: string;
  activity?: (values: FormValues) => string;
  activityAction?: string;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const listKey = ["child", table, updateId ?? "none"];

  const { data: rows } = useQuery({
    queryKey: listKey,
    enabled: Boolean(updateId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("daily_update_id", updateId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Record<string, unknown>[];
    },
  });

  const add = useMutation({
    mutationFn: async (values: FormValues) => {
      const parent = updateId ? { id: updateId } : await ensure();
      const payload: Record<string, unknown> = { ...values };
      for (const [k, v] of Object.entries(payload)) {
        if (v === "none" || v === "") payload[k] = null;
      }
      payload.user_id = userId;
      payload.daily_update_id = parent.id;
      if (withTeam) payload.team_id = teamId;
      if (withWorkDate) payload.work_date = workDate;
      const { error } = await supabase.from(table).insert(payload as never);
      if (error) throw error;
      if (activityAction && userId) {
        await supabase.from("activity_logs").insert({
          actor_id: userId,
          team_id: teamId,
          action: activityAction,
          entity_type: table,
          description: activity
            ? activity(values)
            : `added a ${title.toLowerCase()} entry: ${String(values[titleField] ?? "")}`,
        });
      }
    },
    onSuccess: () => {
      setOpen(false);
      toast.success(`${title} entry saved`);
      void queryClient.invalidateQueries({ queryKey: ["child", table] });
      void queryClient.invalidateQueries({ queryKey: ["daily-update"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error("Could not save", { description: (e as Error).message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entry removed");
      void queryClient.invalidateQueries({ queryKey: listKey });
    },
  });

  const Icon = icon;

  return (
    <SectionCard
      title={title}
      description={description}
      bodyClassName="p-0"
      action={
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
        </Button>
      }
    >
      {!rows || rows.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={Icon}
            title={`No ${title.toLowerCase()} yet`}
            description="Add your first entry for today."
            actionLabel="Add entry"
            onAction={() => setOpen(true)}
          />
        </div>
      ) : (
        <ul className="divide-y">
          {rows.map((row) => (
            <li key={String(row.id)} className="flex items-center gap-3 px-4 py-3">
              {render(row)}
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive ml-auto h-8 w-8 shrink-0"
                onClick={() => remove.mutate(String(row.id))}
                aria-label="Delete entry"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <EntityDialog
        open={open}
        onOpenChange={setOpen}
        title={`Add ${title.toLowerCase()}`}
        description={description}
        fields={fields}
        pending={add.isPending}
        onSubmit={(values) => add.mutate(values)}
        submitLabel="Save entry"
      />
    </SectionCard>
  );
}

