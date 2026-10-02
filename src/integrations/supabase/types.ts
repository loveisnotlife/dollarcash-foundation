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
      app_settings: {
        Row: {
          account_number: string
          account_title: string
          created_at: string
          id: boolean
          updated_at: string
          usd_pkr_rate: number
        }
        Insert: {
          account_number?: string
          account_title?: string
          created_at?: string
          id?: boolean
          updated_at?: string
          usd_pkr_rate?: number
        }
        Update: {
          account_number?: string
          account_title?: string
          created_at?: string
          id?: boolean
          updated_at?: string
          usd_pkr_rate?: number
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount_pkr: number
          amount_usd: number
          created_at: string
          id: string
          method: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_path: string | null
          status: string
          tid: string
          updated_at: string
          usd_pkr_rate: number
          user_id: string
        }
        Insert: {
          amount_pkr: number
          amount_usd: number
          created_at?: string
          id?: string
          method: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string | null
          status?: string
          tid: string
          updated_at?: string
          usd_pkr_rate: number
          user_id: string
        }
        Update: {
          amount_pkr?: number
          amount_usd?: number
          created_at?: string
          id?: string
          method?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string | null
          status?: string
          tid?: string
          updated_at?: string
          usd_pkr_rate?: number
          user_id?: string
        }
        Relationships: []
      }
      investment_plans: {
        Row: {
          cost: number
          created_at: string
          daily_return: number
          duration_days: number
          id: string
          is_active: boolean
          name: string
          sort_order: number
          total_return: number
          updated_at: string
        }
        Insert: {
          cost: number
          created_at?: string
          daily_return: number
          duration_days?: number
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          total_return: number
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          daily_return?: number
          duration_days?: number
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          total_return?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number
          created_at: string
          full_name: string
          id: string
          is_banned: boolean
          phone: string
          referral_code: string
          referred_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          full_name?: string
          id: string
          is_banned?: boolean
          phone: string
          referral_code: string
          referred_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          full_name?: string
          id?: string
          is_banned?: boolean
          phone?: string
          referral_code?: string
          referred_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      profit_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          investment_id: string
          plan_name: string
          profit_date: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          investment_id: string
          plan_name: string
          profit_date: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          investment_id?: string
          plan_name?: string
          profit_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profit_payments_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "user_investments"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          created_at: string
          id: string
          milestone: number
          referrer_id: string
          reward_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          milestone: number
          referrer_id: string
          reward_amount: number
        }
        Update: {
          created_at?: string
          id?: string
          milestone?: number
          referrer_id?: string
          reward_amount?: number
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          created_at: string
          id: string
          reward: number
          task_date: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reward: number
          task_date: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reward?: number
          task_date?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          reward: number
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          reward?: number
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          reward?: number
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      user_investments: {
        Row: {
          activated_at: string
          amount_invested: number
          created_at: string
          daily_return: number
          duration_days: number
          expires_at: string
          id: string
          plan_id: string
          plan_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          amount_invested: number
          created_at?: string
          daily_return: number
          duration_days: number
          expires_at: string
          id?: string
          plan_id: string
          plan_name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string
          amount_invested?: number
          created_at?: string
          daily_return?: number
          duration_days?: number
          expires_at?: string
          id?: string
          plan_id?: string
          plan_name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_investments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "investment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          account_number: string
          account_title: string
          amount_usd: number
          created_at: string
          id: string
          method: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: string
          account_title: string
          amount_usd: number
          created_at?: string
          id?: string
          method: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string
          account_title?: string
          amount_usd?: number
          created_at?: string
          id?: string
          method?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_deposits: {
        Args: { _status?: string }
        Returns: {
          amount_pkr: number
          amount_usd: number
          created_at: string
          full_name: string
          id: string
          method: string
          phone: string
          rejection_reason: string
          reviewed_at: string
          screenshot_path: string
          status: string
          tid: string
          usd_pkr_rate: number
          user_id: string
        }[]
      }
      admin_list_withdrawals: {
        Args: { _status?: string }
        Returns: {
          account_number: string
          account_title: string
          amount_usd: number
          created_at: string
          full_name: string
          id: string
          method: string
          phone: string
          rejection_reason: string
          reviewed_at: string
          status: string
          user_id: string
        }[]
      }
      award_referral_milestones: {
        Args: { _referrer_id: string }
        Returns: undefined
      }
      complete_task: { Args: { _task_id: string }; Returns: Json }
      credit_daily_profits: { Args: never; Returns: Json }
      generate_referral_code: { Args: never; Returns: string }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      my_referral_stats: { Args: never; Returns: Json }
      my_tasks_today: { Args: never; Returns: Json }
      my_withdrawal_gate: { Args: never; Returns: Json }
      purchase_investment_plan: {
        Args: { _plan_id: string }
        Returns: {
          activated_at: string
          amount_invested: number
          created_at: string
          daily_return: number
          duration_days: number
          expires_at: string
          id: string
          plan_id: string
          plan_name: string
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_investments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_withdrawal: {
        Args: {
          _account_number: string
          _account_title: string
          _amount_usd: number
          _method: string
        }
        Returns: {
          account_number: string
          account_title: string
          amount_usd: number
          created_at: string
          id: string
          method: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "withdrawals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_deposit: {
        Args: { _approve: boolean; _deposit_id: string; _reason?: string }
        Returns: {
          amount_pkr: number
          amount_usd: number
          created_at: string
          id: string
          method: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_path: string | null
          status: string
          tid: string
          updated_at: string
          usd_pkr_rate: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "deposits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_withdrawal: {
        Args: { _approve: boolean; _reason?: string; _withdrawal_id: string }
        Returns: {
          account_number: string
          account_title: string
          amount_usd: number
          created_at: string
          id: string
          method: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "withdrawals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      successful_referral_count: {
        Args: { _referrer_id: string }
        Returns: number
      }
      withdrawal_gate_for: { Args: { _uid: string }; Returns: Json }
    }
    Enums: {
      app_role: "user" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["user", "admin"],
    },
  },
} as const
