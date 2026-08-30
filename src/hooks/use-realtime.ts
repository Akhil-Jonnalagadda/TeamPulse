import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to postgres changes on a set of tables and invalidate the given
 * query key prefixes whenever anything changes. Keeps pages live without
 * re-implementing channel plumbing in every route.
 */
export function useRealtimeInvalidate(
  tables: readonly string[],
  keyPrefixes: readonly (readonly unknown[])[],
  options?: { filter?: string; channel?: string },
) {
  const queryClient = useQueryClient();
  const tableKey = tables.join(",");
  const prefixKey = JSON.stringify(keyPrefixes);
  const filter = options?.filter;
  const name = options?.channel ?? `rt-${tableKey}`;

  useEffect(() => {
    const channel = supabase.channel(`${name}-${Math.random().toString(36).slice(2, 8)}`);
    for (const table of tableKey.split(",").filter(Boolean)) {
      channel.on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        () => {
          for (const prefix of JSON.parse(prefixKey) as unknown[][]) {
            void queryClient.invalidateQueries({ queryKey: prefix });
          }
        },
      );
    }
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, tableKey, prefixKey, filter, name]);
}
