import { useEffect, useState } from "react";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { clockTime } from "@/lib/format";

export type ConnectionState = "connecting" | "live" | "offline";

export function useRealtimeStatus() {
  const [state, setState] = useState<ConnectionState>("connecting");

  useEffect(() => {
    const channel = supabase.channel("presence:heartbeat");
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") setState("live");
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED")
        setState("offline");
    });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return state;
}

export function RealtimeIndicator({ lastUpdated }: { lastUpdated?: Date | null }) {
  const state = useRealtimeStatus();
  return (
    <div className="text-muted-foreground flex items-center gap-2 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium ring-1 ring-inset",
          state === "live"
            ? "bg-success/10 text-success ring-success/25"
            : state === "connecting"
              ? "bg-muted text-muted-foreground ring-border"
              : "bg-destructive/10 text-destructive ring-destructive/25",
        )}
        aria-live="polite"
      >
        {state === "live" ? (
          <>
            <span className="bg-success live-dot h-1.5 w-1.5 rounded-full" />
            LIVE
          </>
        ) : state === "connecting" ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" /> Connecting
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" /> Reconnecting
          </>
        )}
      </span>
      {lastUpdated && (
        <span className="hidden items-center gap-1 sm:inline-flex">
          <Wifi className="h-3 w-3" />
          Last updated {clockTime(lastUpdated)}
        </span>
      )}
    </div>
  );
}
