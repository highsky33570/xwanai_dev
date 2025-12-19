export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      characters: {
        Row: {
          id: string
          auth_id: string
          original_source: string | null
          access_level: "public" | "private"
          processing_status: "pending" | "processing" | "pending_reports" | "completed" | "failed"
          category: string
          name: string
          gender: string
          birth_time: string | null
          description: string | null
          mbti: string | null
          tags: string[] | null
          longitude: number | null
          avatar_id: string | null
          reports: Record<string, any> | null
          created_at: string
          updated_at: string
          is_report_ready: boolean | null
          character_metadata: Record<string, any> | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          avatar_id?: string | null
          auth_id?: string | null
          access_level?: "public" | "private"
          data_type?: "virtual" | "real"
          tags?: string[] | null
          gender?: string | null
          mbti?: string | null
          longitude?: number | null
          birthday_utc8?: string | null
          birthplace?: string | null
          paipan?: any | null
          birth_time?: string | null
          category?: string | null
          processing_status?: "pending" | "pending_reports" | "processing" | "completed" | "failed" | null
          reports?: {
            basic?: string
            personal?: string
            luck?: string
            achievement?: string
          } | null
          original_source?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          avatar_id?: string | null
          auth_id?: string | null
          access_level?: "public" | "private"
          data_type?: "virtual" | "real"
          tags?: string[] | null
          gender?: string | null
          mbti?: string | null
          longitude?: number | null
          birthday_utc8?: string | null
          birthplace?: string | null
          paipan?: any | null
          birth_time?: string | null
          category?: string | null
          processing_status?: "pending" | "pending_reports" | "processing" | "completed" | "failed" | null
          reports?: {
            basic?: string
            personal?: string
            luck?: string
            achievement?: string
          } | null
          original_source?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          app_name: string
          user_id: string
          session_id: string
          invocation_id: string
          author: string
          branch: string | null
          timestamp: string
          content: Json
          actions: any
          long_running_tool_ids_json: string | null
          grounding_metadata: Json | null
          partial: boolean | null
          turn_complete: boolean | null
          error_code: string | null
          error_message: string | null
          interrupted: boolean | null
        }
        Insert: {
          id: string
          app_name: string
          user_id: string
          session_id: string
          invocation_id: string
          author: string
          branch?: string | null
          timestamp: string
          content: Json
          actions: any
          long_running_tool_ids_json?: string | null
          grounding_metadata?: Json | null
          partial?: boolean | null
          turn_complete?: boolean | null
          error_code?: string | null
          error_message?: string | null
          interrupted?: boolean | null
        }
        Update: {
          id?: string
          app_name?: string
          user_id?: string
          session_id?: string
          invocation_id?: string
          author?: string
          branch?: string | null
          timestamp?: string
          content?: Json
          actions?: any
          long_running_tool_ids_json?: string | null
          grounding_metadata?: Json | null
          partial?: boolean | null
          turn_complete?: boolean | null
          error_code?: string | null
          error_message?: string | null
          interrupted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "events_app_name_user_id_session_id_fkey"
            columns: ["app_name", "user_id", "session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["app_name", "user_id", "id"]
          }
        ]
      }
      sessions: {
        Row: {
          app_name: string
          user_id: string
          id: string
          state: Json
          create_time: string
          update_time: string
        }
        Insert: {
          app_name: string
          user_id: string
          id: string
          state: Json
          create_time: string
          update_time: string
        }
        Update: {
          app_name?: string
          user_id?: string
          id?: string
          state?: Json
          create_time?: string
          update_time?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          updated_at: string | null
          subscription_status: "free" | "active" | "cancelled" | "expired"
          subscription_tier: "free" | "monthly" | "yearly" | "premium"
          subscription_start_date: string | null
          subscription_end_date: string | null
          stripe_customer_id: string | null
          stripe_session_id: string | null
          last_payment_date: string | null
          last_payment_amount: number | null
          last_payment_currency: "usd" | "cny" | null
          created_at: string | null
          usage_stats: {
            chat_daily_count?: number
            chat_daily_reset_at?: string | null
            hepan_weekly_count?: number
            hepan_weekly_reset_at?: string | null
            character_session_weekly_count?: number
            character_session_weekly_reset_at?: string | null
            xwan_ai_daily_count?: number
            xwan_ai_daily_reset_at?: string | null
            account_created_at?: string
          } | null
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          updated_at?: string | null
          subscription_status?: "free" | "active" | "cancelled" | "expired"
          subscription_tier?: "free" | "monthly" | "yearly" | "premium"
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          last_payment_date?: string | null
          last_payment_amount?: number | null
          last_payment_currency?: "usd" | "cny" | null
          created_at?: string | null
          usage_stats?: {
            chat_daily_count?: number
            chat_daily_reset_at?: string | null
            hepan_weekly_count?: number
            hepan_weekly_reset_at?: string | null
            character_session_weekly_count?: number
            character_session_weekly_reset_at?: string | null
            xwan_ai_daily_count?: number
            xwan_ai_daily_reset_at?: string | null
            account_created_at?: string
          } | null
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          updated_at?: string | null
          subscription_status?: "free" | "active" | "cancelled" | "expired"
          subscription_tier?: "free" | "monthly" | "yearly" | "premium"
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          last_payment_date?: string | null
          last_payment_amount?: number | null
          last_payment_currency?: "usd" | "cny" | null
          created_at?: string | null
          usage_stats?: {
            chat_daily_count?: number
            chat_daily_reset_at?: string | null
            hepan_weekly_count?: number
            hepan_weekly_reset_at?: string | null
            character_session_weekly_count?: number
            character_session_weekly_reset_at?: string | null
            xwan_ai_daily_count?: number
            xwan_ai_daily_reset_at?: string | null
            account_created_at?: string
          } | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      character_public_data: {
        Row: {
          id: string
          created_at: string
          username: string
          uuid: string
          character_name: string
          category_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          username: string
          uuid: string
          character_name: string
          category_id: string
        }
        Update: {
          id?: string
          created_at?: string
          username?: string
          uuid?: string
          character_name?: string
          category_id?: string
        }
        Relationships: []
      }
      invitation_rewards: {
        Row: {
          id: string
          user_id: string
          character_count_bonus: number | null
          session_count_bonus: number | null
          expires_at: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          character_count_bonus?: number | null
          session_count_bonus?: number | null
          expires_at: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          character_count_bonus?: number | null
          session_count_bonus?: number | null
          expires_at?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_rewards_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
  ? (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions] extends {
    Row: infer R
  }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends keyof Database["public"]["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
