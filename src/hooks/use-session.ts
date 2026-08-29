import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "manager" | "team_lead" | "team_member";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  employee_id: string | null;
  avatar_url: string | null;
  team_id: string | null;
  primary_application_id: string | null;
  shift: string;
  status: string;
  is_demo: boolean;
}

export interface CurrentUser {
  session: Session;
  profile: Profile;
  role: AppRole;
  teamId: string | null;
}

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  return { session, ready };
}

export function useCurrentUser() {
  const { session, ready } = useSupabaseSession();
  const userId = session?.user.id;

  const query = useQuery({
    queryKey: ["current-user", userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<{ profile: Profile; role: AppRole } | null> => {
      if (!userId) return null;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (!profile) return null;
      const rank: AppRole[] = ["manager", "team_lead", "team_member"];
      const found = rank.find((r) => (roles ?? []).some((x) => x.role === r));
      return { profile: profile as Profile, role: found ?? "team_member" };
    },
  });

  return {
    ready: ready && (!userId || !query.isLoading),
    session,
    profile: query.data?.profile ?? null,
    role: query.data?.role ?? null,
    teamId: query.data?.profile.team_id ?? null,
    refetch: query.refetch,
  };
}

export function roleHome(role: AppRole | null): string {
  if (role === "manager") return "/dashboard/manager";
  if (role === "team_lead") return "/dashboard/lead";
  return "/dashboard/member";
}
