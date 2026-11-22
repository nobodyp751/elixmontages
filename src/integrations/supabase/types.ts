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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      editor_profiles: {
        Row: {
          available: boolean
          avatar_url: string | null
          bio: string
          completed_orders: number
          created_at: string
          display_name: string
          headline: string
          id: string
          is_demo: boolean
          published: boolean
          rating_avg: number
          rating_count: number
          stripe_account_id: string | null
          styles: Database["public"]["Enums"]["video_style"][]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          available?: boolean
          avatar_url?: string | null
          bio?: string
          completed_orders?: number
          created_at?: string
          display_name?: string
          headline?: string
          id?: string
          is_demo?: boolean
          published?: boolean
          rating_avg?: number
          rating_count?: number
          stripe_account_id?: string | null
          styles?: Database["public"]["Enums"]["video_style"][]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          available?: boolean
          avatar_url?: string | null
          bio?: string
          completed_orders?: number
          created_at?: string
          display_name?: string
          headline?: string
          id?: string
          is_demo?: boolean
          published?: boolean
          rating_avg?: number
          rating_count?: number
          stripe_account_id?: string | null
          styles?: Database["public"]["Enums"]["video_style"][]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "editor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          active: boolean
          created_at: string
          delivery_days: number
          description: string
          editor_id: string
          extra_revision_cents: number
          id: string
          included_revisions: number
          kind: Database["public"]["Enums"]["offer_kind"]
          price_cents: number
          title: string
          videos_count: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          delivery_days?: number
          description?: string
          editor_id: string
          extra_revision_cents?: number
          id?: string
          included_revisions?: number
          kind?: Database["public"]["Enums"]["offer_kind"]
          price_cents: number
          title: string
          videos_count?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          delivery_days?: number
          description?: string
          editor_id?: string
          extra_revision_cents?: number
          id?: string
          included_revisions?: number
          kind?: Database["public"]["Enums"]["offer_kind"]
          price_cents?: number
          title?: string
          videos_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "offers_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "editor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_deliveries: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          note: string
          order_id: string
          url: string | null
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          note?: string
          order_id: string
          url?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          note?: string
          order_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          order_id: string
          sender_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind?: string
          order_id: string
          sender_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          order_id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_cents: number
          brief: string
          commission_cents: number
          completed_at: string | null
          created_at: string
          creator_id: string
          delivered_at: string | null
          delivery_days: number
          dispute_reason: string | null
          editor_amount_cents: number
          editor_id: string
          editor_user_id: string | null
          extra_revision_cents: number
          extras_cents: number
          id: string
          included_revisions: number
          kind: Database["public"]["Enums"]["offer_kind"]
          offer_id: string | null
          paid_at: string | null
          payment_mode: string
          payout_status: string
          revisions_used: number
          rushes_url: string
          status: Database["public"]["Enums"]["order_status"]
          title: string
          updated_at: string
          videos_count: number
        }
        Insert: {
          amount_cents?: number
          brief?: string
          commission_cents?: number
          completed_at?: string | null
          created_at?: string
          creator_id: string
          delivered_at?: string | null
          delivery_days?: number
          dispute_reason?: string | null
          editor_amount_cents?: number
          editor_id: string
          editor_user_id?: string | null
          extra_revision_cents?: number
          extras_cents?: number
          id?: string
          included_revisions?: number
          kind?: Database["public"]["Enums"]["offer_kind"]
          offer_id?: string | null
          paid_at?: string | null
          payment_mode?: string
          payout_status?: string
          revisions_used?: number
          rushes_url: string
          status?: Database["public"]["Enums"]["order_status"]
          title?: string
          updated_at?: string
          videos_count?: number
        }
        Update: {
          amount_cents?: number
          brief?: string
          commission_cents?: number
          completed_at?: string | null
          created_at?: string
          creator_id?: string
          delivered_at?: string | null
          delivery_days?: number
          dispute_reason?: string | null
          editor_amount_cents?: number
          editor_id?: string
          editor_user_id?: string | null
          extra_revision_cents?: number
          extras_cents?: number
          id?: string
          included_revisions?: number
          kind?: Database["public"]["Enums"]["offer_kind"]
          offer_id?: string | null
          paid_at?: string | null
          payment_mode?: string
          payout_status?: string
          revisions_used?: number
          rushes_url?: string
          status?: Database["public"]["Enums"]["order_status"]
          title?: string
          updated_at?: string
          videos_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "editor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_videos: {
        Row: {
          created_at: string
          duration_category: Database["public"]["Enums"]["duration_category"]
          editor_id: string
          id: string
          position: number
          poster_url: string | null
          style: Database["public"]["Enums"]["video_style"]
          title: string
          video_path: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          duration_category?: Database["public"]["Enums"]["duration_category"]
          editor_id: string
          id?: string
          position?: number
          poster_url?: string | null
          style?: Database["public"]["Enums"]["video_style"]
          title?: string
          video_path?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          duration_category?: Database["public"]["Enums"]["duration_category"]
          editor_id?: string
          id?: string
          position?: number
          poster_url?: string | null
          style?: Database["public"]["Enums"]["video_style"]
          title?: string
          video_path?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_videos_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "editor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          creator_id: string | null
          editor_id: string
          id: string
          order_id: string | null
          rating: number
          reviewer_name: string
        }
        Insert: {
          comment?: string
          created_at?: string
          creator_id?: string | null
          editor_id: string
          id?: string
          order_id?: string | null
          rating: number
          reviewer_name?: string
        }
        Update: {
          comment?: string
          created_at?: string
          creator_id?: string | null
          editor_id?: string
          id?: string
          order_id?: string | null
          rating?: number
          reviewer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "editor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
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
      cancel_order: { Args: { _order_id: string }; Returns: undefined }
      commission_for: { Args: { _cents: number }; Returns: number }
      complete_order: { Args: { _order_id: string }; Returns: undefined }
      deliver_order: {
        Args: {
          _file_path: string
          _note: string
          _order_id: string
          _url: string
        }
        Returns: undefined
      }
      editor_visible: { Args: { _editor_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_order_participant: { Args: { _order_id: string }; Returns: boolean }
      mark_payout_paid: { Args: { _order_id: string }; Returns: undefined }
      open_dispute: {
        Args: { _order_id: string; _reason: string }
        Returns: undefined
      }
      owns_editor: { Args: { _editor_id: string }; Returns: boolean }
      post_system_message: {
        Args: { _body: string; _order_id: string }
        Returns: undefined
      }
      recompute_split: { Args: { _order_id: string }; Returns: undefined }
      request_revision: {
        Args: { _note: string; _order_id: string }
        Returns: undefined
      }
      resolve_dispute: {
        Args: { _order_id: string; _outcome: string }
        Returns: undefined
      }
      simulate_payment: { Args: { _order_id: string }; Returns: undefined }
    }
    Enums: {
      account_type: "creator" | "editor"
      app_role: "admin" | "user"
      duration_category: "under_30" | "s30_60" | "m1_3" | "over_3"
      offer_kind: "unit" | "pack"
      order_status:
        | "pending_payment"
        | "in_progress"
        | "delivered"
        | "revision_requested"
        | "completed"
        | "disputed"
        | "refunded"
        | "cancelled"
      video_style:
        | "gaming"
        | "business"
        | "humour"
        | "vlog"
        | "lifestyle"
        | "education"
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
      account_type: ["creator", "editor"],
      app_role: ["admin", "user"],
      duration_category: ["under_30", "s30_60", "m1_3", "over_3"],
      offer_kind: ["unit", "pack"],
      order_status: [
        "pending_payment",
        "in_progress",
        "delivered",
        "revision_requested",
        "completed",
        "disputed",
        "refunded",
        "cancelled",
      ],
      video_style: [
        "gaming",
        "business",
        "humour",
        "vlog",
        "lifestyle",
        "education",
      ],
    },
  },
} as const
