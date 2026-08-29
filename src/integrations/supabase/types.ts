export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
          team_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          team_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      analyses: {
        Row: {
          application_id: string | null
          created_at: string
          daily_update_id: string | null
          data_reviewed: string | null
          findings: string | null
          id: string
          observations: string | null
          problem_statement: string | null
          recommendation: string | null
          reference_ticket: string | null
          root_cause: string | null
          status: Database["public"]["Enums"]["analysis_status"]
          team_id: string | null
          title: string
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          daily_update_id?: string | null
          data_reviewed?: string | null
          findings?: string | null
          id?: string
          observations?: string | null
          problem_statement?: string | null
          recommendation?: string | null
          reference_ticket?: string | null
          root_cause?: string | null
          status?: Database["public"]["Enums"]["analysis_status"]
          team_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          work_date?: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          daily_update_id?: string | null
          data_reviewed?: string | null
          findings?: string | null
          id?: string
          observations?: string | null
          problem_statement?: string | null
          recommendation?: string | null
          reference_ticket?: string | null
          root_cause?: string | null
          status?: Database["public"]["Enums"]["analysis_status"]
          team_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_daily_update_id_fkey"
            columns: ["daily_update_id"]
            isOneToOne: false
            referencedRelation: "daily_updates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          created_at: string
          criticality: string
          description: string | null
          id: string
          name: string
          owner_team_id: string | null
          status: string
          support_hours: string
        }
        Insert: {
          created_at?: string
          criticality?: string
          description?: string | null
          id?: string
          name: string
          owner_team_id?: string | null
          status?: string
          support_hours?: string
        }
        Update: {
          created_at?: string
          criticality?: string
          description?: string | null
          id?: string
          name?: string
          owner_team_id?: string | null
          status?: string
          support_hours?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_owner_team_id_fkey"
            columns: ["owner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      blockers: {
        Row: {
          created_at: string
          daily_update_id: string | null
          description: string
          expected_resolution: string | null
          id: string
          impact: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          resolved_at: string | null
          status: string
          team_id: string | null
          user_id: string
          waiting_on: string | null
          work_date: string
        }
        Insert: {
          created_at?: string
          daily_update_id?: string | null
          description: string
          expected_resolution?: string | null
          id?: string
          impact?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          resolved_at?: string | null
          status?: string
          team_id?: string | null
          user_id: string
          waiting_on?: string | null
          work_date?: string
        }
        Update: {
          created_at?: string
          daily_update_id?: string | null
          description?: string
          expected_resolution?: string | null
          id?: string
          impact?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          resolved_at?: string | null
          status?: string
          team_id?: string | null
          user_id?: string
          waiting_on?: string | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "blockers_daily_update_id_fkey"
            columns: ["daily_update_id"]
            isOneToOne: false
            referencedRelation: "daily_updates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blockers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          action_items: string | null
          call_type: string
          created_at: string
          daily_update_id: string | null
          discussion: string | null
          duration_minutes: number
          end_time: string | null
          id: string
          organizer: string | null
          participants: string | null
          purpose: string | null
          start_time: string | null
          team_id: string | null
          title: string
          user_id: string
          work_date: string
        }
        Insert: {
          action_items?: string | null
          call_type?: string
          created_at?: string
          daily_update_id?: string | null
          discussion?: string | null
          duration_minutes?: number
          end_time?: string | null
          id?: string
          organizer?: string | null
          participants?: string | null
          purpose?: string | null
          start_time?: string | null
          team_id?: string | null
          title: string
          user_id: string
          work_date?: string
        }
        Update: {
          action_items?: string | null
          call_type?: string
          created_at?: string
          daily_update_id?: string | null
          discussion?: string | null
          duration_minutes?: number
          end_time?: string | null
          id?: string
          organizer?: string | null
          participants?: string | null
          purpose?: string | null
          start_time?: string | null
          team_id?: string | null
          title?: string
          user_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_daily_update_id_fkey"
            columns: ["daily_update_id"]
            isOneToOne: false
            referencedRelation: "daily_updates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_tasks: {
        Row: {
          application_id: string | null
          category: string
          comments: string | null
          created_at: string
          daily_update_id: string
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["task_status"]
          ticket_number: string | null
          ticket_url: string | null
          time_spent: number
          title: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          category?: string
          comments?: string | null
          created_at?: string
          daily_update_id: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["task_status"]
          ticket_number?: string | null
          ticket_url?: string | null
          time_spent?: number
          title: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          category?: string
          comments?: string | null
          created_at?: string
          daily_update_id?: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["task_status"]
          ticket_number?: string | null
          ticket_url?: string | null
          time_spent?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tasks_daily_update_id_fkey"
            columns: ["daily_update_id"]
            isOneToOne: false
            referencedRelation: "daily_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_updates: {
        Row: {
          analysis_hours: number
          created_at: string
          id: string
          incident_hours: number
          learning_hours: number
          location: string
          meeting_hours: number
          primary_application_id: string | null
          productive_hours: number
          reviewed_at: string | null
          reviewed_by: string | null
          shift: string
          submission_status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string | null
          summary: string | null
          support_hours: number
          team_id: string | null
          total_hours: number
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          analysis_hours?: number
          created_at?: string
          id?: string
          incident_hours?: number
          learning_hours?: number
          location?: string
          meeting_hours?: number
          primary_application_id?: string | null
          productive_hours?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift?: string
          submission_status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          summary?: string | null
          support_hours?: number
          team_id?: string | null
          total_hours?: number
          updated_at?: string
          user_id: string
          work_date?: string
        }
        Update: {
          analysis_hours?: number
          created_at?: string
          id?: string
          incident_hours?: number
          learning_hours?: number
          location?: string
          meeting_hours?: number
          primary_application_id?: string | null
          productive_hours?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift?: string
          submission_status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          summary?: string | null
          support_hours?: number
          team_id?: string | null
          total_hours?: number
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_updates_primary_application_id_fkey"
            columns: ["primary_application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_updates_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_participants: {
        Row: {
          id: string
          incident_id: string
          joined_at: string | null
          left_at: string | null
          participation_type: string
          user_id: string
        }
        Insert: {
          id?: string
          incident_id: string
          joined_at?: string | null
          left_at?: string | null
          participation_type?: string
          user_id: string
        }
        Update: {
          id?: string
          incident_id?: string
          joined_at?: string | null
          left_at?: string | null
          participation_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_participants_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          application_id: string | null
          bridge_duration: number
          bridge_required: boolean
          business_impact: string | null
          created_at: string
          daily_update_id: string | null
          description: string | null
          duration_minutes: number
          end_time: string | null
          follow_up_required: boolean
          id: string
          incident_number: string
          notes: string | null
          problem_ticket: string | null
          rca_required: boolean
          resolution: string | null
          root_cause: string | null
          severity: Database["public"]["Enums"]["severity_level"]
          start_time: string | null
          status: Database["public"]["Enums"]["incident_status"]
          team_id: string | null
          title: string
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          application_id?: string | null
          bridge_duration?: number
          bridge_required?: boolean
          business_impact?: string | null
          created_at?: string
          daily_update_id?: string | null
          description?: string | null
          duration_minutes?: number
          end_time?: string | null
          follow_up_required?: boolean
          id?: string
          incident_number: string
          notes?: string | null
          problem_ticket?: string | null
          rca_required?: boolean
          resolution?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["severity_level"]
          start_time?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          team_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          work_date?: string
        }
        Update: {
          application_id?: string | null
          bridge_duration?: number
          bridge_required?: boolean
          business_impact?: string | null
          created_at?: string
          daily_update_id?: string | null
          description?: string | null
          duration_minutes?: number
          end_time?: string | null
          follow_up_required?: boolean
          id?: string
          incident_number?: string
          notes?: string | null
          problem_ticket?: string | null
          rca_required?: boolean
          resolution?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["severity_level"]
          start_time?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          team_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_daily_update_id_fkey"
            columns: ["daily_update_id"]
            isOneToOne: false
            referencedRelation: "daily_updates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      learnings: {
        Row: {
          category: string
          created_at: string
          daily_update_id: string | null
          description: string | null
          id: string
          share_with_team: boolean
          source: string | null
          team_id: string | null
          technology: string | null
          title: string
          useful_for_team: boolean
          user_id: string
          work_date: string
        }
        Insert: {
          category?: string
          created_at?: string
          daily_update_id?: string | null
          description?: string | null
          id?: string
          share_with_team?: boolean
          source?: string | null
          team_id?: string | null
          technology?: string | null
          title: string
          useful_for_team?: boolean
          user_id: string
          work_date?: string
        }
        Update: {
          category?: string
          created_at?: string
          daily_update_id?: string | null
          description?: string | null
          id?: string
          share_with_team?: boolean
          source?: string | null
          team_id?: string | null
          technology?: string | null
          title?: string
          useful_for_team?: boolean
          user_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "learnings_daily_update_id_fkey"
            columns: ["daily_update_id"]
            isOneToOne: false
            referencedRelation: "daily_updates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learnings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          daily_update_id: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          daily_update_id: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          daily_update_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_comments_daily_update_id_fkey"
            columns: ["daily_update_id"]
            isOneToOne: false
            referencedRelation: "daily_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          employee_id: string | null
          full_name: string
          id: string
          is_demo: boolean
          primary_application_id: string | null
          shift: string
          status: string
          team_id: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          employee_id?: string | null
          full_name: string
          id: string
          is_demo?: boolean
          primary_application_id?: string | null
          shift?: string
          status?: string
          team_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          employee_id?: string | null
          full_name?: string
          id?: string
          is_demo?: boolean
          primary_application_id?: string | null
          shift?: string
          status?: string
          team_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_primary_application_id_fkey"
            columns: ["primary_application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          cutoff_time: string
          description: string | null
          id: string
          manager_id: string | null
          name: string
          team_lead_id: string | null
          timezone: string
          working_hours: number
        }
        Insert: {
          created_at?: string
          cutoff_time?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          team_lead_id?: string | null
          timezone?: string
          working_hours?: number
        }
        Update: {
          created_at?: string
          cutoff_time?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          team_lead_id?: string | null
          timezone?: string
          working_hours?: number
        }
        Relationships: []
      }
      tomorrow_plans: {
        Row: {
          created_at: string
          daily_update_id: string
          expected_outcome: string | null
          id: string
          priority: Database["public"]["Enums"]["priority_level"]
          task: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_update_id: string
          expected_outcome?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          task: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_update_id?: string
          expected_outcome?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          task?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tomorrow_plans_daily_update_id_fkey"
            columns: ["daily_update_id"]
            isOneToOne: false
            referencedRelation: "daily_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_user: { Args: { _user_id: string }; Returns: boolean }
      ensure_profile: {
        Args: {
          _full_name: string
          _role?: Database["public"]["Enums"]["app_role"]
          _team_name?: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_team_id: { Args: never; Returns: string }
      team_of: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      analysis_status: "started" | "in_progress" | "completed" | "needs_review"
      app_role: "manager" | "team_lead" | "team_member"
      incident_status:
        | "open"
        | "investigating"
        | "monitoring"
        | "resolved"
        | "closed"
      priority_level: "low" | "medium" | "high" | "critical"
      severity_level: "P1" | "P2" | "P3" | "P4"
      submission_status:
        | "draft"
        | "submitted"
        | "reviewed"
        | "needs_clarification"
      task_status: "completed" | "in_progress" | "blocked" | "pending"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      analysis_status: ["started", "in_progress", "completed", "needs_review"],
      app_role: ["manager", "team_lead", "team_member"],
      incident_status: [
        "open",
        "investigating",
        "monitoring",
        "resolved",
        "closed",
      ],
      priority_level: ["low", "medium", "high", "critical"],
      severity_level: ["P1", "P2", "P3", "P4"],
      submission_status: [
        "draft",
        "submitted",
        "reviewed",
        "needs_clarification",
      ],
      task_status: ["completed", "in_progress", "blocked", "pending"],
    },
  },
} as const
