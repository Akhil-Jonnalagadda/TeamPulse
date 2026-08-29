import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/common/States";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface NotificationRow {
  id: string;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  created_at: string;
}

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, type, read, created_at")
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => void queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

export function NotificationPopover({ userId }: { userId: string | undefined }) {
  const queryClient = useQueryClient();
  const { data } = useNotifications(userId);
  const unread = (data ?? []).filter((n) => !n.read).length;

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread} unread`}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="bg-destructive text-destructive-foreground absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-88 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAll.mutate()}>
              <CheckCheck className="mr-1 h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        {(data ?? []).length === 0 ? (
          <EmptyState icon={Bell} title="You're all caught up" description="New alerts will land here." />
        ) : (
          <ScrollArea className="h-80">
            <ul className="divide-y">
              {(data ?? []).map((n) => (
                <li key={n.id} className={cn("px-3 py-2.5", !n.read && "bg-primary/4")}>
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.message && <p className="text-muted-foreground text-xs">{n.message}</p>}
                      <p className="text-muted-foreground mt-0.5 text-[11px]">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
