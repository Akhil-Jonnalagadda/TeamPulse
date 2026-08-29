import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Activity, AlertTriangle, BookOpen, CheckCircle2, FlaskConical, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserAvatar } from "@/components/common/UserAvatar";
import { CardSkeleton, EmptyState } from "@/components/common/States";
import { ScrollArea } from "@/components/ui/scroll-area";
import { timeAgo } from "@/lib/format";

interface ActivityRow {
  id: string;
  actor_id: string;
  action: string;
  description: string;
  created_at: string;
  team_id: string | null;
  profiles?: { full_name: string } | null;
}

const ICONS: Record<string, typeof Activity> = {
  submitted_update: CheckCircle2,
  incident_logged: AlertTriangle,
  incident_resolved: Activity,
  analysis_completed: FlaskConical,
  learning_added: BookOpen,
  blocker_created: AlertTriangle,
};

export function ActivityFeed({ teamId, limit = 25 }: { teamId?: string | null; limit?: number }) {
  const queryClient = useQueryClient();
  const key = ["activity", teamId ?? "all"];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      let q = supabase
        .from("activity_logs")
        .select("id, actor_id, action, description, created_at, team_id")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (teamId) q = q.eq("team_id", teamId);
      const { data: rows, error } = await q;
      if (error) throw error;
      const ids = [...new Set((rows ?? []).map((r) => r.actor_id))];
      const { data: people } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      const byId = new Map((people ?? []).map((p) => [p.id, p.full_name]));
      return (rows ?? []).map((r) => ({
        ...r,
        actorName: byId.get(r.actor_id) ?? "Team member",
      })) as (ActivityRow & { actorName: string })[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`activity-feed-${teamId ?? "all"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs" }, () => {
        void queryClient.invalidateQueries({ queryKey: key });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, queryClient]);

  if (isLoading) return <CardSkeleton rows={5} />;
  if (!data || data.length === 0)
    return (
      <EmptyState
        icon={Radio}
        title="No activity yet today"
        description="Team actions will stream in here as they happen."
      />
    );

  return (
    <ScrollArea className="h-[420px]">
      <ol className="relative space-y-0.5 px-4 py-2">
        {data.map((item) => {
          const Icon = ICONS[item.action] ?? Activity;
          return (
            <li key={item.id} className="hover:bg-accent/60 group flex gap-3 rounded-lg px-2 py-2.5 transition-colors">
              <div className="relative">
                <UserAvatar name={item.actorName} size="sm" />
                <span className="bg-card border-border absolute -right-1 -bottom-1 rounded-full border p-0.5">
                  <Icon className="text-muted-foreground h-2.5 w-2.5" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">
                  <span className="font-medium">{item.actorName}</span>{" "}
                  <span className="text-muted-foreground">{item.description}</span>
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  {format(new Date(item.created_at), "h:mm a")} · {timeAgo(item.created_at)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </ScrollArea>
  );
}
