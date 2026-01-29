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
      households: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          added_by: string | null
          barcode: string | null
          category: string | null
          created_at: string
          expiry_date: string | null
          household_id: string
          id: string
          is_out: boolean
          name: string
          quantity: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          barcode?: string | null
          category?: string | null
          created_at?: string
          expiry_date?: string | null
          household_id: string
          id?: string
          is_out?: boolean
          name: string
          quantity?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          barcode?: string | null
          category?: string | null
          created_at?: string
          expiry_date?: string | null
          household_id?: string
          id?: string
          is_out?: boolean
          name?: string
          quantity?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          household_id: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          household_id?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          household_id?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      // Marketplace tables
      marketplace_listings: {
        Row: {
          id: string
          household_id: string
          item_id: string | null
          mode: 's-comm' | 'b-comm'
          title: string
          description: string | null
          quantity: number
          price: number | null
          condition: string | null
          status: 'available' | 'pending' | 'completed' | 'cancelled' | 'expired'
          created_at: string
          expires_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          item_id?: string | null
          mode?: 's-comm' | 'b-comm'
          title: string
          description?: string | null
          quantity?: number
          price?: number | null
          condition?: string | null
          status?: 'available' | 'pending' | 'completed' | 'cancelled' | 'expired'
          created_at?: string
          expires_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          item_id?: string | null
          mode?: 's-comm' | 'b-comm'
          title?: string
          description?: string | null
          quantity?: number
          price?: number | null
          condition?: string | null
          status?: 'available' | 'pending' | 'completed' | 'cancelled' | 'expired'
          created_at?: string
          expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_requests: {
        Row: {
          id: string
          listing_id: string
          requester_household_id: string
          owner_household_id: string
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
          message: string | null
          proposed_quantity: number | null
          proposed_price: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          requester_household_id: string
          owner_household_id: string
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
          message?: string | null
          proposed_quantity?: number | null
          proposed_price?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          requester_household_id?: string
          owner_household_id?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
          message?: string | null
          proposed_quantity?: number | null
          proposed_price?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_requests_requester_household_id_fkey"
            columns: ["requester_household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_requests_owner_household_fkey"
            columns: ["owner_household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_chats: {
        Row: {
          id: string
          request_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          request_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_chats_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "marketplace_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_messages: {
        Row: {
          id: string
          chat_id: string
          sender_household_id: string
          sender_profile_id: string | null
          content: string
          message_type: 'text' | 'offer' | 'accept' | 'decline' | 'system'
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          sender_household_id: string
          sender_profile_id?: string | null
          content: string
          message_type?: 'text' | 'offer' | 'accept' | 'decline' | 'system'
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          sender_household_id?: string
          sender_profile_id?: string | null
          content?: string
          message_type?: 'text' | 'offer' | 'accept' | 'decline' | 'system'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "marketplace_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_messages_sender_household_id_fkey"
            columns: ["sender_household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      marketplace_listings_available: {
        Row: {
          id: string
          household_id: string
          item_id: string | null
          mode: 's-comm' | 'b-comm'
          title: string
          description: string | null
          quantity: number
          price: number | null
          condition: string | null
          created_at: string
          expires_at: string | null
          household_name: string
        }
      }
      my_marketplace_listings: {
        Row: {
          id: string
          household_id: string
          item_id: string | null
          mode: 's-comm' | 'b-comm'
          title: string
          description: string | null
          quantity: number
          price: number | null
          condition: string | null
          status: 'available' | 'pending' | 'completed' | 'cancelled' | 'expired'
          created_at: string
          expires_at: string | null
          updated_at: string
          household_name: string
        }
      }
      my_incoming_requests: {
        Row: {
          id: string
          listing_id: string
          requester_household_id: string
          owner_household_id: string
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
          message: string | null
          proposed_quantity: number | null
          proposed_price: number | null
          created_at: string
          updated_at: string
          listing_title: string
          listing_mode: 's-comm' | 'b-comm'
          listing_price: number | null
          requester_household_name: string
        }
      }
      my_outgoing_requests: {
        Row: {
          id: string
          listing_id: string
          requester_household_id: string
          owner_household_id: string
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
          message: string | null
          proposed_quantity: number | null
          proposed_price: number | null
          created_at: string
          updated_at: string
          listing_title: string
          listing_mode: 's-comm' | 'b-comm'
          listing_price: number | null
          listing_condition: string | null
          owner_household_name: string
        }
      }
    }
    Functions: {
      get_user_household_id: { Args: never; Returns: string }
      is_member_of_household: {
        Args: { _household_id: string }
        Returns: boolean
      }
      can_access_marketplace_listing: {
        Args: { _listing_id: string }
        Returns: boolean
      }
      can_access_marketplace_request: {
        Args: { _request_id: string }
        Returns: boolean
      }
      can_access_marketplace_chat: {
        Args: { _chat_id: string }
        Returns: boolean
      }
      create_listing_from_inventory: {
        Args: {
          _item_id: string
          _mode: 's-comm' | 'b-comm'
          _title: string
          _description: string
          _price?: number
          _condition?: string
          _expires_at?: string
        }
        Returns: string
      }
    }
    Enums: {
      marketplace_listing_mode: 's-comm' | 'b-comm'
      marketplace_listing_status: 'available' | 'pending' | 'completed' | 'cancelled' | 'expired'
      marketplace_request_status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
      marketplace_message_type: 'text' | 'offer' | 'accept' | 'decline' | 'system'
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
      marketplace_listing_mode: {
        S_COMM: 's-comm',
        B_COMM: 'b-comm',
      } as const,
      marketplace_listing_status: {
        AVAILABLE: 'available',
        PENDING: 'pending',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        EXPIRED: 'expired',
      } as const,
      marketplace_request_status: {
        PENDING: 'pending',
        ACCEPTED: 'accepted',
        REJECTED: 'rejected',
        CANCELLED: 'cancelled',
        COMPLETED: 'completed',
      } as const,
      marketplace_message_type: {
        TEXT: 'text',
        OFFER: 'offer',
        ACCEPT: 'accept',
        DECLINE: 'decline',
        SYSTEM: 'system',
      } as const,
    },
  },
} as const
