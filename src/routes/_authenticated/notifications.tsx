import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Bell, CheckCheck, Info, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { CardSkeleton, EmptyState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — TeamPulse" },
      { name: "description", content: "Alerts, mentions and review requests that need your attention." },
      { property: "og:title", content: "Notifications — TeamPulse" },
      { property: "og:description", content: "Everything that needs your attention in TeamPulse." },
    ],
  }),
  component: NotificationsPage,
});

const ICONS = { warning: AlertTriangle, error: ShieldAlert, success: CheckCheck, info: Info } as const;

function NotificationsPage() {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const [tab, setTab] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return rows ?? [];
    },
  });

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      await supabase.from("notifications").update({ read: true }).in("id", ids);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const rows = data ?? [];
  const unread = rows.filter((n) => !n.read);
  const list = tab === "unread" ? unread : rows;

  return (
    <div className="space-y-5">
      <PageHeader title="Notifications" description={`${unread.length} unread`}>
        <Button
          variant="outline"
          disabled={unread.length === 0 || markRead.isPending}
          onClick={() => markRead.mutate(unread.map((n) => n.id))}
        >
          <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>
      </Tabs>

      <SectionCard title="Inbox" description="Latest first" bodyClassName="p-0">
        {isLoading ? (
          <div className="p-4">
            <CardSkeleton rows={5} />
          </div>
        ) : list.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={Bell} title="All caught up" description="No notifications to show." />
          </div>
        ) : (
          <ul className="divide-y">
            {list.map((n) => {
              const Icon = ICONS[(n.type as keyof typeof ICONS) ?? "info"] ?? Info;
              return (
                <li
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3",
                    !n.read && "bg-accent/40",
                  )}
                >
                  <Icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      {!n.read && <Badge variant="secondary">New</Badge>}
                    </div>
                    {n.message && <p className="text-muted-foreground text-sm">{n.message}</p>}
                    <p className="text-muted-foreground mt-1 text-xs">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <Button size="sm" variant="ghost" onClick={() => markRead.mutate([n.id])}>
                      Mark read
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
