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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      echelon_conversations: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_summary: boolean | null
          lesson_id: number
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_summary?: boolean | null
          lesson_id: number
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_summary?: boolean | null
          lesson_id?: number
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "echelon_conversations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      field_guide_pages: {
        Row: {
          created_at: string | null
          id: string
          narrative: string
          page_type: string
          trait_tag: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          narrative: string
          page_type: string
          trait_tag: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          narrative?: string
          page_type?: string
          trait_tag?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lesson_metadata: {
        Row: {
          created_at: string | null
          id: string
          last_updated: string | null
          lesson_version: number
          total_lessons: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          lesson_version?: number
          total_lessons?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          lesson_version?: number
          total_lessons?: number
        }
        Relationships: []
      }
      lessons: {
        Row: {
          briefing: string | null
          created_at: string | null
          debrief: string | null
          drill1_prompt: string | null
          drill2_prompt: string | null
          echelon_closing: string | null
          echelon_opening: string | null
          field_guide_prompt: string | null
          final_question: string | null
          fog_level: number | null
          head: string | null
          id: number
          lesson_modifiers: Json | null
          lesson_number: number
          lesson_summary: string | null
          lesson_title: string
          mini_framework: string | null
          mission_badge_description: string | null
          mission_drill: string | null
          phase: string
          practical: string | null
          read_block: string
          section_id: number
          section_name: string
          stage_order: Json | null
          stage_type: Json | null
          story_beat: string | null
          systems_lesson: string | null
          think_prompts: string | null
          think_reflection: string | null
          tone: string | null
          unlock_key: string | null
          unlock_type: string | null
          video_url: string | null
          visibility_ruleset: string | null
        }
        Insert: {
          briefing?: string | null
          created_at?: string | null
          debrief?: string | null
          drill1_prompt?: string | null
          drill2_prompt?: string | null
          echelon_closing?: string | null
          echelon_opening?: string | null
          field_guide_prompt?: string | null
          final_question?: string | null
          fog_level?: number | null
          head?: string | null
          id?: number
          lesson_modifiers?: Json | null
          lesson_number: number
          lesson_summary?: string | null
          lesson_title: string
          mini_framework?: string | null
          mission_badge_description?: string | null
          mission_drill?: string | null
          phase: string
          practical?: string | null
          read_block: string
          section_id: number
          section_name: string
          stage_order?: Json | null
          stage_type?: Json | null
          story_beat?: string | null
          systems_lesson?: string | null
          think_prompts?: string | null
          think_reflection?: string | null
          tone?: string | null
          unlock_key?: string | null
          unlock_type?: string | null
          video_url?: string | null
          visibility_ruleset?: string | null
        }
        Update: {
          briefing?: string | null
          created_at?: string | null
          debrief?: string | null
          drill1_prompt?: string | null
          drill2_prompt?: string | null
          echelon_closing?: string | null
          echelon_opening?: string | null
          field_guide_prompt?: string | null
          final_question?: string | null
          fog_level?: number | null
          head?: string | null
          id?: number
          lesson_modifiers?: Json | null
          lesson_number?: number
          lesson_summary?: string | null
          lesson_title?: string
          mini_framework?: string | null
          mission_badge_description?: string | null
          mission_drill?: string | null
          phase?: string
          practical?: string | null
          read_block?: string
          section_id?: number
          section_name?: string
          stage_order?: Json | null
          stage_type?: Json | null
          story_beat?: string | null
          systems_lesson?: string | null
          think_prompts?: string | null
          think_reflection?: string | null
          tone?: string | null
          unlock_key?: string | null
          unlock_type?: string | null
          video_url?: string | null
          visibility_ruleset?: string | null
        }
        Relationships: []
      }
      mission_stage_history: {
        Row: {
          created_at: string | null
          echelon_response: string | null
          id: string
          session_id: string | null
          stage: string
          system_prompt: string | null
          user_message: string | null
        }
        Insert: {
          created_at?: string | null
          echelon_response?: string | null
          id?: string
          session_id?: string | null
          stage: string
          system_prompt?: string | null
          user_message?: string | null
        }
        Update: {
          created_at?: string | null
          echelon_response?: string | null
          id?: string
          session_id?: string | null
          stage?: string
          system_prompt?: string | null
          user_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_stage_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_lesson_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_evolution_log: {
        Row: {
          created_at: string | null
          id: string
          insight_text: string | null
          insight_type: string | null
          lesson_id: number | null
          subskill_unlocked: string | null
          trait_tag: string | null
          unlock_key: string | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          insight_text?: string | null
          insight_type?: string | null
          lesson_id?: number | null
          subskill_unlocked?: string | null
          trait_tag?: string | null
          unlock_key?: string | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          insight_text?: string | null
          insight_type?: string | null
          lesson_id?: number | null
          subskill_unlocked?: string | null
          trait_tag?: string | null
          unlock_key?: string | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      operator_identity_notes: {
        Row: {
          created_at: string | null
          id: string
          note_content: string | null
          note_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note_content?: string | null
          note_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note_content?: string | null
          note_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      operator_traits: {
        Row: {
          created_at: string | null
          id: string
          shadow_revealed: boolean | null
          subskills_unlocked: Json | null
          superpower_revealed: boolean | null
          trait_tag: string
          unlocked: boolean | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          shadow_revealed?: boolean | null
          subskills_unlocked?: Json | null
          superpower_revealed?: boolean | null
          trait_tag: string
          unlocked?: boolean | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          shadow_revealed?: boolean | null
          subskills_unlocked?: Json | null
          superpower_revealed?: boolean | null
          trait_tag?: string
          unlocked?: boolean | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_stage: string
          field_guide_generated: boolean | null
          id: string
          lesson_id: number
          memory_snapshot: Json | null
          started_at: string | null
          traits_unlocked: Json | null
          updated_at: string | null
          user_id: string
          visibility_snapshot: Json | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_stage?: string
          field_guide_generated?: boolean | null
          id?: string
          lesson_id: number
          memory_snapshot?: Json | null
          started_at?: string | null
          traits_unlocked?: Json | null
          updated_at?: string | null
          user_id: string
          visibility_snapshot?: Json | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_stage?: string
          field_guide_generated?: boolean | null
          id?: string
          lesson_id?: number
          memory_snapshot?: Json | null
          started_at?: string | null
          traits_unlocked?: Json | null
          updated_at?: string | null
          user_id?: string
          visibility_snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reflections: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: number
          mission_choice: string | null
          reflection_content: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id: number
          mission_choice?: string | null
          reflection_content: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: number
          mission_choice?: string | null
          reflection_content?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reflections_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visibility_rules: {
        Row: {
          allow_field_guide_narratives: boolean | null
          allowed_content_fields: Json | null
          forbidden_content_fields: Json | null
          id: string
          show_identity_tags: boolean | null
          show_long_term_memory: boolean | null
          show_short_term_memory: boolean | null
          stage: string
        }
        Insert: {
          allow_field_guide_narratives?: boolean | null
          allowed_content_fields?: Json | null
          forbidden_content_fields?: Json | null
          id?: string
          show_identity_tags?: boolean | null
          show_long_term_memory?: boolean | null
          show_short_term_memory?: boolean | null
          stage: string
        }
        Update: {
          allow_field_guide_narratives?: boolean | null
          allowed_content_fields?: Json | null
          forbidden_content_fields?: Json | null
          id?: string
          show_identity_tags?: boolean | null
          show_long_term_memory?: boolean | null
          show_short_term_memory?: boolean | null
          stage?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_lesson_version: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
