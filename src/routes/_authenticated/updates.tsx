import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { useMembers } from "@/lib/queries";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { CardSkeleton, EmptyState } from "@/components/common/States";
import { StatusBadge } from "@/components/common/Badges";
import { UserAvatar } from "@/components/common/UserAvatar";
import { FilterSelect, OptionSelect, RangeSelect, SearchInput, Toolbar } from "@/components/common/Toolbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { daysAgoIso, downloadCsv, hours, prettyDate, shortDate, timeAgo } from "@/lib/format";

const SUBMISSION_STATUSES = ["draft", "submitted", "reviewed", "needs_clarification"] as const;

export const Route = createFileRoute("/_authenticated/updates")({
  head: () => ({
    meta: [
      { title: "Daily Updates — TeamPulse" },
      {
        name: "description",
        content: "Browse, filter, review and export submitted daily updates across your team.",
      },
      { property: "og:title", content: "Daily Updates — TeamPulse" },
      { property: "og:description", content: "Review and export daily updates in TeamPulse." },
    ],
  }),
  component: UpdatesPage,
});

interface UpdateRow {
  id: string;
  user_id: string;
  work_date: string;
  shift: string;
  location: string;
  total_hours: number;
  productive_hours: number;
  incident_hours: number;
  meeting_hours: number;
  summary: string | null;
  submission_status: string;
  submitted_at: string | null;
}

function UpdatesPage() {
  const { profile, role, teamId } = useCurrentUser();
  const queryClient = useQueryClient();
  const { data: members } = useMembers(role === "manager" ? null : teamId);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [person, setPerson] = useState("all");
  const [range, setRange] = useState("14");
  const [active, setActive] = useState<UpdateRow | null>(null);
  const [comment, setComment] = useState("");

  const since = daysAgoIso(Number(range) - 1);

  const { data, isLoading } = useQuery({
    queryKey: ["updates-list", role, teamId, range],
    enabled: Boolean(profile),
    queryFn: async (): Promise<UpdateRow[]> => {
      let q = supabase
        .from("daily_updates")
        .select(
          "id, user_id, work_date, shift, location, total_hours, productive_hours, incident_hours, meeting_hours, summary, submission_status, submitted_at",
        )
        .gte("work_date", since)
        .order("work_date", { ascending: false });
      if (role === "team_member") q = q.eq("user_id", profile!.id);
      else if (role === "team_lead" && teamId) q = q.eq("team_id", teamId);
      const { data: rows, error } = await q;
      if (error) throw error;
      return (rows ?? []) as UpdateRow[];
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["update-comments", active?.id],
    enabled: Boolean(active?.id),
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("manager_comments")
        .select("id, body, author_id, created_at")
        .eq("daily_update_id", active!.id)
        .order("created_at");
      return rows ?? [];
    },
  });

  const memberName = useMemo(
    () => new Map((members ?? []).map((m) => [m.id, m.full_name])),
    [members],
  );

  const filtered = (data ?? []).filter((u) => {
    if (status !== "all" && u.submission_status !== status) return false;
    if (person !== "all" && u.user_id !== person) return false;
    if (search) {
      const hay = `${memberName.get(u.user_id) ?? ""} ${u.summary ?? ""} ${u.work_date}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const canReview = role !== "team_member";

  const setStatusMutation = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: string }) => {
      const { error } = await supabase
        .from("daily_updates")
        .update({ submission_status: next as never, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Update status changed");
      void queryClient.invalidateQueries({ queryKey: ["updates-list"] });
      setActive(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("manager_comments").insert({
        daily_update_id: active!.id,
        author_id: profile!.id,
        body: comment.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      void queryClient.invalidateQueries({ queryKey: ["update-comments"] });
      toast.success("Comment added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Daily updates"
        description={`${filtered.length} updates in the selected period`}
      >
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              `daily-updates-${since}.csv`,
              filtered.map((u) => ({
                date: u.work_date,
                member: memberName.get(u.user_id) ?? u.user_id,
                shift: u.shift,
                location: u.location,
                total_hours: u.total_hours,
                productive_hours: u.productive_hours,
                status: u.submission_status,
                summary: u.summary ?? "",
              })),
            )
          }
        >
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </PageHeader>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search updates…" />
        <FilterSelect value={status} onChange={setStatus} options={SUBMISSION_STATUSES} allLabel="All statuses" />
        {canReview && (
          <OptionSelect
            value={person}
            onChange={setPerson}
            options={(members ?? []).map((m) => ({ id: m.id, name: m.full_name }))}
            allLabel="All people"
          />
        )}
        <RangeSelect value={range} onChange={setRange} />
      </Toolbar>

      <SectionCard title="Updates" description="Newest first" bodyClassName="p-0">
        {isLoading ? (
          <div className="p-4">
            <CardSkeleton rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={FileText} title="No updates found" description="Try a wider date range or different filters." />
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((u) => (
              <li key={u.id}>
                <button
                  onClick={() => setActive(u)}
                  className="hover:bg-accent/50 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                >
                  <UserAvatar name={memberName.get(u.user_id) ?? "Member"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {memberName.get(u.user_id) ?? "Team member"} · {shortDate(u.work_date)}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {u.shift} · {u.location} · {hours(u.total_hours)}
                      {u.summary ? ` · ${u.summary}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={u.submission_status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Sheet open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle>{memberName.get(active.user_id) ?? "Daily update"}</SheetTitle>
                <SheetDescription>{prettyDate(active.work_date)}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Detail label="Shift" value={active.shift} />
                  <Detail label="Location" value={active.location} />
                  <Detail label="Total hours" value={hours(active.total_hours)} />
                  <Detail label="Productive" value={hours(active.productive_hours)} />
                  <Detail label="Incidents" value={hours(active.incident_hours)} />
                  <Detail label="Meetings" value={hours(active.meeting_hours)} />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase">Summary</p>
                  <p className="mt-1 text-sm">{active.summary || "No summary provided."}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={active.submission_status} />
                  <span className="text-muted-foreground text-xs">
                    {active.submitted_at ? `submitted ${timeAgo(active.submitted_at)}` : "not submitted"}
                  </span>
                </div>

                {canReview && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => setStatusMutation.mutate({ id: active.id, next: "reviewed" })}
                      disabled={setStatusMutation.isPending}
                    >
                      Mark reviewed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setStatusMutation.mutate({ id: active.id, next: "needs_clarification" })
                      }
                      disabled={setStatusMutation.isPending}
                    >
                      Request clarification
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs font-medium uppercase">Comments</p>
                  {(comments ?? []).length === 0 ? (
                    <p className="text-muted-foreground text-sm">No comments yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {(comments ?? []).map((c) => (
                        <li key={c.id} className="bg-muted/50 rounded-md p-2.5 text-sm">
                          <p>{c.body}</p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {memberName.get(c.author_id) ?? "Reviewer"} · {timeAgo(c.created_at)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                  {canReview && (
                    <div className="space-y-2">
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Leave feedback for this update…"
                        maxLength={1000}
                        rows={3}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!comment.trim() || addComment.isPending}
                        onClick={() => addComment.mutate()}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" /> Add comment
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-md p-2">
      <p className="text-muted-foreground text-[11px] font-medium uppercase">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
