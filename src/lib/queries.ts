import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppRow {
  id: string;
  name: string;
  criticality: string;
  status: string;
  support_hours: string;
  description: string | null;
  owner_team_id: string | null;
}

export interface TeamRow {
  id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  team_lead_id: string | null;
  cutoff_time: string;
  working_hours: number;
}

export interface MemberRow {
  id: string;
  full_name: string;
  email: string;
  employee_id: string | null;
  avatar_url: string | null;
  team_id: string | null;
  primary_application_id: string | null;
  shift: string;
  status: string;
}

export function useApplications() {
  return useQuery({
    queryKey: ["applications"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<AppRow[]> => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, name, criticality, status, support_hours, description, owner_team_id")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<TeamRow[]> => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, description, manager_id, team_lead_id, cutoff_time, working_hours")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMembers(teamId?: string | null) {
  return useQuery({
    queryKey: ["members", teamId ?? "all"],
    staleTime: 60_000,
    queryFn: async (): Promise<MemberRow[]> => {
      let q = supabase
        .from("profiles")
        .select(
          "id, full_name, email, employee_id, avatar_url, team_id, primary_application_id, shift, status",
        )
        .order("full_name");
      if (teamId) q = q.eq("team_id", teamId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function nameMap(members: MemberRow[] | undefined) {
  return new Map((members ?? []).map((m) => [m.id, m.full_name]));
}
