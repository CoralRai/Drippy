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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      clothing_items: {
        Row: {
          amazon_link: string | null
          body_types: string[]
          category: string
          color_hex: string | null
          color_palette: string[]
          created_at: string
          fit_type: string | null
          flipkart_link: string | null
          gender: string
          id: string
          image_url: string | null
          myntra_link: string | null
          name: string
          occasions: string[]
          primary_color: string | null
          style_tags: string[]
          subcategory: string | null
        }
        Insert: {
          amazon_link?: string | null
          body_types?: string[]
          category: string
          color_hex?: string | null
          color_palette?: string[]
          created_at?: string
          fit_type?: string | null
          flipkart_link?: string | null
          gender?: string
          id?: string
          image_url?: string | null
          myntra_link?: string | null
          name: string
          occasions?: string[]
          primary_color?: string | null
          style_tags?: string[]
          subcategory?: string | null
        }
        Update: {
          amazon_link?: string | null
          body_types?: string[]
          category?: string
          color_hex?: string | null
          color_palette?: string[]
          created_at?: string
          fit_type?: string | null
          flipkart_link?: string | null
          gender?: string
          id?: string
          image_url?: string | null
          myntra_link?: string | null
          name?: string
          occasions?: string[]
          primary_color?: string | null
          style_tags?: string[]
          subcategory?: string | null
        }
        Relationships: []
      }
      generated_outfits: {
        Row: {
          accessory_item_id: string | null
          bottom_item_id: string | null
          created_at: string
          footwear_item_id: string | null
          id: string
          occasion: string
          outerwear_item_id: string | null
          score_breakdown: Json
          styling_tip: string | null
          top_item_id: string | null
          total_score: number
          user_id: string
        }
        Insert: {
          accessory_item_id?: string | null
          bottom_item_id?: string | null
          created_at?: string
          footwear_item_id?: string | null
          id?: string
          occasion: string
          outerwear_item_id?: string | null
          score_breakdown?: Json
          styling_tip?: string | null
          top_item_id?: string | null
          total_score?: number
          user_id: string
        }
        Update: {
          accessory_item_id?: string | null
          bottom_item_id?: string | null
          created_at?: string
          footwear_item_id?: string | null
          id?: string
          occasion?: string
          outerwear_item_id?: string | null
          score_breakdown?: Json
          styling_tip?: string | null
          top_item_id?: string | null
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_outfits_accessory_item_id_fkey"
            columns: ["accessory_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_outfits_bottom_item_id_fkey"
            columns: ["bottom_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_outfits_footwear_item_id_fkey"
            columns: ["footwear_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_outfits_outerwear_item_id_fkey"
            columns: ["outerwear_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_outfits_top_item_id_fkey"
            columns: ["top_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_compatibility: {
        Row: {
          compatibility_score: number
          created_at: string
          id: string
          item_a_id: string
          item_b_id: string
          source: string
        }
        Insert: {
          compatibility_score?: number
          created_at?: string
          id?: string
          item_a_id: string
          item_b_id: string
          source?: string
        }
        Update: {
          compatibility_score?: number
          created_at?: string
          id?: string
          item_a_id?: string
          item_b_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_compatibility_item_a_id_fkey"
            columns: ["item_a_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_compatibility_item_b_id_fkey"
            columns: ["item_b_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["id"]
          },
        ]
      }
      outfits: {
        Row: {
          accessories: string | null
          amazon_link: string | null
          body_types: string[]
          bottom: string
          color_palette: string[] | null
          compatibility_score: number | null
          created_at: string
          description: string | null
          fit_type: string | null
          flipkart_link: string | null
          footwear: string
          gender: string
          id: string
          image_url: string | null
          myntra_link: string | null
          name: string
          occasions: string[]
          style_tags: string[]
          styling_tip: string | null
          top: string
        }
        Insert: {
          accessories?: string | null
          amazon_link?: string | null
          body_types?: string[]
          bottom: string
          color_palette?: string[] | null
          compatibility_score?: number | null
          created_at?: string
          description?: string | null
          fit_type?: string | null
          flipkart_link?: string | null
          footwear: string
          gender: string
          id?: string
          image_url?: string | null
          myntra_link?: string | null
          name: string
          occasions?: string[]
          style_tags?: string[]
          styling_tip?: string | null
          top: string
        }
        Update: {
          accessories?: string | null
          amazon_link?: string | null
          body_types?: string[]
          bottom?: string
          color_palette?: string[] | null
          compatibility_score?: number | null
          created_at?: string
          description?: string | null
          fit_type?: string | null
          flipkart_link?: string | null
          footwear?: string
          gender?: string
          id?: string
          image_url?: string | null
          myntra_link?: string | null
          name?: string
          occasions?: string[]
          style_tags?: string[]
          styling_tip?: string | null
          top?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reddit_fashion_data: {
        Row: {
          expires_at: string
          extracted_combinations: Json
          extracted_items: string[]
          id: string
          post_title: string | null
          raw_content: string | null
          scraped_at: string
          sentiment_score: number | null
          subreddit: string
        }
        Insert: {
          expires_at?: string
          extracted_combinations?: Json
          extracted_items?: string[]
          id?: string
          post_title?: string | null
          raw_content?: string | null
          scraped_at?: string
          sentiment_score?: number | null
          subreddit: string
        }
        Update: {
          expires_at?: string
          extracted_combinations?: Json
          extracted_items?: string[]
          id?: string
          post_title?: string | null
          raw_content?: string | null
          scraped_at?: string
          sentiment_score?: number | null
          subreddit?: string
        }
        Relationships: []
      }
      saved_outfits: {
        Row: {
          accessory_item_id: string | null
          bottom_item_id: string | null
          created_at: string
          footwear_item_id: string | null
          id: string
          occasion: string | null
          outerwear_item_id: string | null
          top_item_id: string | null
          total_score: number
          user_id: string
        }
        Insert: {
          accessory_item_id?: string | null
          bottom_item_id?: string | null
          created_at?: string
          footwear_item_id?: string | null
          id?: string
          occasion?: string | null
          outerwear_item_id?: string | null
          top_item_id?: string | null
          total_score?: number
          user_id: string
        }
        Update: {
          accessory_item_id?: string | null
          bottom_item_id?: string | null
          created_at?: string
          footwear_item_id?: string | null
          id?: string
          occasion?: string | null
          outerwear_item_id?: string | null
          top_item_id?: string | null
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_outfits_accessory_item_id_fkey"
            columns: ["accessory_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_outfits_bottom_item_id_fkey"
            columns: ["bottom_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_outfits_footwear_item_id_fkey"
            columns: ["footwear_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_outfits_outerwear_item_id_fkey"
            columns: ["outerwear_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_outfits_top_item_id_fkey"
            columns: ["top_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["id"]
          },
        ]
      }
      style_quizzes: {
        Row: {
          age_group: string
          body_type: string
          color_palette: string[]
          created_at: string
          gender: string
          height: string
          id: string
          preferred_fit: string
          skin_tone: string
          style_preferences: string[]
          updated_at: string
          user_id: string
          weight: string
        }
        Insert: {
          age_group: string
          body_type: string
          color_palette?: string[]
          created_at?: string
          gender: string
          height: string
          id?: string
          preferred_fit: string
          skin_tone: string
          style_preferences?: string[]
          updated_at?: string
          user_id: string
          weight: string
        }
        Update: {
          age_group?: string
          body_type?: string
          color_palette?: string[]
          created_at?: string
          gender?: string
          height?: string
          id?: string
          preferred_fit?: string
          skin_tone?: string
          style_preferences?: string[]
          updated_at?: string
          user_id?: string
          weight?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          clothing_item_id: string | null
          created_at: string
          id: string
          interaction_type: string
          metadata: Json | null
          outfit_id: string | null
          style_tags: string[]
          user_id: string
        }
        Insert: {
          clothing_item_id?: string | null
          created_at?: string
          id?: string
          interaction_type: string
          metadata?: Json | null
          outfit_id?: string | null
          style_tags?: string[]
          user_id: string
        }
        Update: {
          clothing_item_id?: string | null
          created_at?: string
          id?: string
          interaction_type?: string
          metadata?: Json | null
          outfit_id?: string | null
          style_tags?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_clothing_item_id_fkey"
            columns: ["clothing_item_id"]
            isOneToOne: false
            referencedRelation: "clothing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interactions_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wardrobe: {
        Row: {
          category: string
          color: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          notes: string | null
          style_tags: string[]
          user_id: string
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          style_tags?: string[]
          user_id: string
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          style_tags?: string[]
          user_id?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
