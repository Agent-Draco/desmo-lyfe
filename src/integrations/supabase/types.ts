>inventory_items: {
        Row: {
          added_by: string | null
          barcode: string | null
          batch_number: string
          created_at: string
          expiry_date: string | null
          household_id: string
          id: string
          is_out: boolean
          manufacturing_date: string | null
          name: string
          quantity: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          barcode?: string | null
          batch_number?: string
          created_at?: string
          expiry_date?: string | null
          household_id: string
          id?: string
          is_out?: boolean
          manufacturing_date?: string | null
          name: string
          quantity?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          barcode?: string | null
          batch_number?: string
          created_at?: string
          expiry_date?: string | null
          household_id?: string
          id?: string
          is_out?: boolean
          manufacturing_date?: string | null
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
=======
      inventory_items: {
        Row: {
          added_by: string | null
          barcode: string | null
          batch_number: string
          created_at: string
          expiry_date: string | null
          household_id: string
          id: string
          is_out: boolean
          manufacturing_date: string | null
          name: string
          quantity: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          barcode?: string | null
          batch_number?: string
          created_at?: string
          expiry_date?: string | null
          household_id: string
          id?: string
          is_out?: boolean
          manufacturing_date?: string | null
          name: string
          quantity?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          barcode?: string | null
          batch_number?: string
          created_at?: string
          expiry_date?: string | null
          household_id?: string
          id?: string
          is_out?: boolean
          manufacturing_date?: string | null
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
      shopping_list: {
        Row: {
          created_at: string
          household_id: string
          id: string
          item_name: string
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          item_name: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          item_name?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
