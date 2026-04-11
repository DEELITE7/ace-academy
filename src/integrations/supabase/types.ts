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
      announcements: {
        Row: {
          category: string | null
          content: string
          course_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_pinned: boolean | null
          is_published: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          is_published?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          is_published?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      anti_cheat_logs: {
        Row: {
          attempt_id: string
          created_at: string
          details: Json | null
          id: string
          user_id: string
          violation_type: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id: string
          violation_type: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "anti_cheat_logs_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_visible: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_bank_details: {
        Row: {
          account_name: string
          account_number: string
          bank_code: string | null
          bank_name: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_code?: string | null
          bank_name: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_code?: string | null
          bank_name?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: []
      }
      creator_earnings: {
        Row: {
          amount: number
          created_at: string
          creator_id: string
          currency: string
          id: string
          payout_status: string
          purchase_id: string | null
          quiz_set_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          creator_id: string
          currency?: string
          id?: string
          payout_status?: string
          purchase_id?: string | null
          quiz_set_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          creator_id?: string
          currency?: string
          id?: string
          payout_status?: string
          purchase_id?: string | null
          quiz_set_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_earnings_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "quiz_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_earnings_quiz_set_id_fkey"
            columns: ["quiz_set_id"]
            isOneToOne: false
            referencedRelation: "quiz_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back_text: string
          course_id: string
          created_at: string
          explanation: string | null
          front_text: string
          id: string
          topic: string | null
        }
        Insert: {
          back_text: string
          course_id: string
          created_at?: string
          explanation?: string | null
          front_text: string
          id?: string
          topic?: string | null
        }
        Update: {
          back_text?: string
          course_id?: string
          created_at?: string
          explanation?: string | null
          front_text?: string
          id?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          best_percentage: number
          best_score: number
          course_id: string | null
          display_name: string
          id: string
          quiz_set_id: string | null
          total_attempts: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_percentage?: number
          best_score?: number
          course_id?: string | null
          display_name: string
          id?: string
          quiz_set_id?: string | null
          total_attempts?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_percentage?: number
          best_score?: number
          course_id?: string | null
          display_name?: string
          id?: string
          quiz_set_id?: string | null
          total_attempts?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_entries_quiz_set_id_fkey"
            columns: ["quiz_set_id"]
            isOneToOne: false
            referencedRelation: "quiz_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          provider: string | null
          provider_reference: string | null
          purchase_id: string | null
          quiz_set_id: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          provider?: string | null
          provider_reference?: string | null
          purchase_id?: string | null
          quiz_set_id: string
          status?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          provider?: string | null
          provider_reference?: string | null
          purchase_id?: string | null
          quiz_set_id?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "quiz_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_quiz_set_id_fkey"
            columns: ["quiz_set_id"]
            isOneToOne: false
            referencedRelation: "quiz_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_earnings: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          purchase_id: string | null
          quiz_set_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          purchase_id?: string | null
          quiz_set_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          purchase_id?: string | null
          quiz_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_earnings_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "quiz_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_earnings_quiz_set_id_fkey"
            columns: ["quiz_set_id"]
            isOneToOne: false
            referencedRelation: "quiz_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_options: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean | null
          option_label: string
          option_text: string
          question_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean | null
          option_label: string
          option_text: string
          question_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean | null
          option_label?: string
          option_text?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          difficulty: string | null
          explanation: string | null
          id: string
          order_index: number | null
          question_text: string
          quiz_set_id: string
          topic: string | null
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          order_index?: number | null
          question_text: string
          quiz_set_id: string
          topic?: string | null
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          order_index?: number | null
          question_text?: string
          quiz_set_id?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_set_id_fkey"
            columns: ["quiz_set_id"]
            isOneToOne: false
            referencedRelation: "quiz_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempt_answers: {
        Row: {
          answered_at: string | null
          attempt_id: string
          id: string
          is_correct: boolean | null
          is_marked_for_review: boolean | null
          question_id: string
          selected_option_id: string | null
        }
        Insert: {
          answered_at?: string | null
          attempt_id: string
          id?: string
          is_correct?: boolean | null
          is_marked_for_review?: boolean | null
          question_id: string
          selected_option_id?: string | null
        }
        Update: {
          answered_at?: string | null
          attempt_id?: string
          id?: string
          is_correct?: boolean | null
          is_marked_for_review?: boolean | null
          question_id?: string
          selected_option_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "question_options"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          completed_at: string | null
          duration_seconds: number | null
          id: string
          percentage: number
          quiz_set_id: string
          score: number
          started_at: string
          status: string | null
          total_questions: number
          user_id: string
          violation_log: Json | null
          violations: number | null
        }
        Insert: {
          completed_at?: string | null
          duration_seconds?: number | null
          id?: string
          percentage?: number
          quiz_set_id: string
          score?: number
          started_at?: string
          status?: string | null
          total_questions: number
          user_id: string
          violation_log?: Json | null
          violations?: number | null
        }
        Update: {
          completed_at?: string | null
          duration_seconds?: number | null
          id?: string
          percentage?: number
          quiz_set_id?: string
          score?: number
          started_at?: string
          status?: string | null
          total_questions?: number
          user_id?: string
          violation_log?: Json | null
          violations?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_set_id_fkey"
            columns: ["quiz_set_id"]
            isOneToOne: false
            referencedRelation: "quiz_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_purchases: {
        Row: {
          amount_paid: number
          created_at: string
          creator_share: number
          currency: string
          id: string
          payment_provider: string | null
          payment_status: string
          platform_share: number
          provider_reference: string | null
          quiz_set_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          creator_share?: number
          currency?: string
          id?: string
          payment_provider?: string | null
          payment_status?: string
          platform_share?: number
          provider_reference?: string | null
          quiz_set_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          creator_share?: number
          currency?: string
          id?: string
          payment_provider?: string | null
          payment_status?: string
          platform_share?: number
          provider_reference?: string | null
          quiz_set_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_purchases_quiz_set_id_fkey"
            columns: ["quiz_set_id"]
            isOneToOne: false
            referencedRelation: "quiz_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_sets: {
        Row: {
          course_id: string
          created_at: string
          creator_id: string | null
          currency: string
          description: string | null
          difficulty: string | null
          id: string
          instructions: string | null
          is_monetized: boolean
          is_visible: boolean | null
          max_attempts: number | null
          owner_share_percent: number
          passing_score: number | null
          platform_share_percent: number
          price_amount: number
          public_quiz_code: string | null
          purchase_count: number
          randomize_options: boolean | null
          randomize_questions: boolean | null
          show_explanations: boolean | null
          show_results_immediately: boolean | null
          status: string
          tags: string[] | null
          thumbnail_url: string | null
          time_limit_minutes: number | null
          title: string
          total_plays: number
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          creator_id?: string | null
          currency?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          instructions?: string | null
          is_monetized?: boolean
          is_visible?: boolean | null
          max_attempts?: number | null
          owner_share_percent?: number
          passing_score?: number | null
          platform_share_percent?: number
          price_amount?: number
          public_quiz_code?: string | null
          purchase_count?: number
          randomize_options?: boolean | null
          randomize_questions?: boolean | null
          show_explanations?: boolean | null
          show_results_immediately?: boolean | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          time_limit_minutes?: number | null
          title: string
          total_plays?: number
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          creator_id?: string | null
          currency?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          instructions?: string | null
          is_monetized?: boolean
          is_visible?: boolean | null
          max_attempts?: number | null
          owner_share_percent?: number
          passing_score?: number | null
          platform_share_percent?: number
          price_amount?: number
          public_quiz_code?: string | null
          purchase_count?: number
          randomize_options?: boolean | null
          randomize_questions?: boolean | null
          show_explanations?: boolean | null
          show_results_immediately?: boolean | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          time_limit_minutes?: number | null
          title?: string
          total_plays?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_sets_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_sets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      generate_quiz_code: { Args: never; Returns: string }
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
