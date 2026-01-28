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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_action_logs: {
        Row: {
          action_type: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string
          id: string
          new_value: Json | null
          old_value: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      department_settings: {
        Row: {
          bitrix_webhook_url: string | null
          created_at: string
          department: string
          google_private_key: string | null
          google_service_account_email: string | null
          google_sheets_id: string | null
          id: string
          telegram_bot_token: string | null
          telegram_chat_id: string | null
          updated_at: string
        }
        Insert: {
          bitrix_webhook_url?: string | null
          created_at?: string
          department: string
          google_private_key?: string | null
          google_service_account_email?: string | null
          google_sheets_id?: string | null
          id?: string
          telegram_bot_token?: string | null
          telegram_chat_id?: string | null
          updated_at?: string
        }
        Update: {
          bitrix_webhook_url?: string | null
          created_at?: string
          department?: string
          google_private_key?: string | null
          google_service_account_email?: string | null
          google_sheets_id?: string | null
          id?: string
          telegram_bot_token?: string | null
          telegram_chat_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          department: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          position: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          position?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          position?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          ai_analysis: Json | null
          assigned_to: string | null
          attachment_url: string | null
          auto_response: string | null
          bitrix_task_id: string | null
          contact: string | null
          created_at: string
          deadline: string | null
          department: string
          final_photo_url: string | null
          id: string
          is_anonymous: boolean
          message: string
          name: string | null
          object_code: string | null
          redirected_at: string | null
          redirected_from: string | null
          status: string
          sub_status: string | null
          task_status_id: string | null
          task_substatus_id: string | null
          type: string
          urgency: string
          urgency_level: number | null
          user_role: string
        }
        Insert: {
          ai_analysis?: Json | null
          assigned_to?: string | null
          attachment_url?: string | null
          auto_response?: string | null
          bitrix_task_id?: string | null
          contact?: string | null
          created_at?: string
          deadline?: string | null
          department: string
          final_photo_url?: string | null
          id?: string
          is_anonymous?: boolean
          message: string
          name?: string | null
          object_code?: string | null
          redirected_at?: string | null
          redirected_from?: string | null
          status?: string
          sub_status?: string | null
          task_status_id?: string | null
          task_substatus_id?: string | null
          type: string
          urgency?: string
          urgency_level?: number | null
          user_role: string
        }
        Update: {
          ai_analysis?: Json | null
          assigned_to?: string | null
          attachment_url?: string | null
          auto_response?: string | null
          bitrix_task_id?: string | null
          contact?: string | null
          created_at?: string
          deadline?: string | null
          department?: string
          final_photo_url?: string | null
          id?: string
          is_anonymous?: boolean
          message?: string
          name?: string | null
          object_code?: string | null
          redirected_at?: string | null
          redirected_from?: string | null
          status?: string
          sub_status?: string | null
          task_status_id?: string | null
          task_substatus_id?: string | null
          type?: string
          urgency?: string
          urgency_level?: number | null
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_task_status_id_fkey"
            columns: ["task_status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_task_substatus_id_fkey"
            columns: ["task_substatus_id"]
            isOneToOne: false
            referencedRelation: "task_substatuses"
            referencedColumns: ["id"]
          },
        ]
      }
      residential_objects: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      sub_statuses: {
        Row: {
          created_at: string
          created_by: string | null
          department: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      task_statuses: {
        Row: {
          created_at: string
          created_by: string | null
          department: string
          id: string
          is_active: boolean
          is_final: boolean
          name: string
          position: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department: string
          id?: string
          is_active?: boolean
          is_final?: boolean
          name: string
          position?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string
          id?: string
          is_active?: boolean
          is_final?: boolean
          name?: string
          position?: number
        }
        Relationships: []
      }
      task_substatuses: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          position: number
          status_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          position?: number
          status_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          status_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_substatuses_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_departments: {
        Row: {
          created_at: string
          department: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
