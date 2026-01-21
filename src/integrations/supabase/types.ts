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
      admin_activity_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_sessions: {
        Row: {
          admin_user_id: string
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          session_token: string
          user_agent: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown
          session_token: string
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login: string | null
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Relationships: []
      }
      audio_metadata: {
        Row: {
          audio_format: string | null
          consent_store: boolean | null
          consent_train: boolean | null
          created_at: string | null
          device_info: string | null
          duration_ms: number | null
          encryption_key_version: number | null
          file_size_bytes: number | null
          id: string
          phrase_text: string | null
          quality_score: number | null
          sample_rate: number | null
          session_pseudonym: string
          unencrypted_file_path: string | null
          unencrypted_file_size_bytes: number | null
          unencrypted_storage_bucket: string | null
        }
        Insert: {
          audio_format?: string | null
          consent_store?: boolean | null
          consent_train?: boolean | null
          created_at?: string | null
          device_info?: string | null
          duration_ms?: number | null
          encryption_key_version?: number | null
          file_size_bytes?: number | null
          id?: string
          phrase_text?: string | null
          quality_score?: number | null
          sample_rate?: number | null
          session_pseudonym: string
          unencrypted_file_path?: string | null
          unencrypted_file_size_bytes?: number | null
          unencrypted_storage_bucket?: string | null
        }
        Update: {
          audio_format?: string | null
          consent_store?: boolean | null
          consent_train?: boolean | null
          created_at?: string | null
          device_info?: string | null
          duration_ms?: number | null
          encryption_key_version?: number | null
          file_size_bytes?: number | null
          id?: string
          phrase_text?: string | null
          quality_score?: number | null
          sample_rate?: number | null
          session_pseudonym?: string
          unencrypted_file_path?: string | null
          unencrypted_file_size_bytes?: number | null
          unencrypted_storage_bucket?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: []
      }
      encrypted_audio_files: {
        Row: {
          created_at: string | null
          encrypted_blob: string | null
          id: string
          iv: string | null
          metadata_id: string | null
          salt: string | null
        }
        Insert: {
          created_at?: string | null
          encrypted_blob?: string | null
          id?: string
          iv?: string | null
          metadata_id?: string | null
          salt?: string | null
        }
        Update: {
          created_at?: string | null
          encrypted_blob?: string | null
          id?: string
          iv?: string | null
          metadata_id?: string | null
          salt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encrypted_audio_files_metadata_id_fkey"
            columns: ["metadata_id"]
            isOneToOne: false
            referencedRelation: "audio_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      encryption_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          version: number
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          version: number
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          version?: number
        }
        Relationships: []
      }
      participant_consents: {
        Row: {
          adult_declaration: boolean
          age_range: string
          consent_evidence_data: Json | null
          consent_store: boolean
          consent_train: boolean
          country: string
          created_at: string
          device_info: string | null
          email: string | null
          full_name: string
          id: string
          ip_address: string | null
          region: string
          session_pseudonym: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          adult_declaration?: boolean
          age_range: string
          consent_evidence_data?: Json | null
          consent_store?: boolean
          consent_train?: boolean
          country: string
          created_at?: string
          device_info?: string | null
          email?: string | null
          full_name: string
          id?: string
          ip_address?: string | null
          region: string
          session_pseudonym: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          adult_declaration?: boolean
          age_range?: string
          consent_evidence_data?: Json | null
          consent_store?: boolean
          consent_train?: boolean
          country?: string
          created_at?: string
          device_info?: string | null
          email?: string | null
          full_name?: string
          id?: string
          ip_address?: string | null
          region?: string
          session_pseudonym?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      recordings: {
        Row: {
          audio_url: string | null
          consent_store: boolean | null
          consent_train: boolean | null
          created_at: string | null
          device_label: string | null
          duration_ms: number | null
          format: string | null
          full_name: string | null
          id: string
          phrase_text: string | null
          sample_rate: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          audio_url?: string | null
          consent_store?: boolean | null
          consent_train?: boolean | null
          created_at?: string | null
          device_label?: string | null
          duration_ms?: number | null
          format?: string | null
          full_name?: string | null
          id?: string
          phrase_text?: string | null
          sample_rate?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          audio_url?: string | null
          consent_store?: boolean | null
          consent_train?: boolean | null
          created_at?: string | null
          device_label?: string | null
          duration_ms?: number | null
          format?: string | null
          full_name?: string | null
          id?: string
          phrase_text?: string | null
          sample_rate?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      session_mapping: {
        Row: {
          created_at: string | null
          encrypted_session_id: string | null
          id: string
          mapping_iv: string | null
          mapping_salt: string | null
          session_pseudonym: string
        }
        Insert: {
          created_at?: string | null
          encrypted_session_id?: string | null
          id?: string
          mapping_iv?: string | null
          mapping_salt?: string | null
          session_pseudonym: string
        }
        Update: {
          created_at?: string | null
          encrypted_session_id?: string | null
          id?: string
          mapping_iv?: string | null
          mapping_salt?: string | null
          session_pseudonym?: string
        }
        Relationships: []
      }
      training_progress: {
        Row: {
          completed_phrases: string[] | null
          golden_index: number
          phase: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_phrases?: string[] | null
          golden_index?: number
          phase?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_phrases?: string[] | null
          golden_index?: number
          phase?: string
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
      get_participant_consents_with_token: {
        Args: { p_session_token: string }
        Returns: {
          adult_declaration: boolean
          adult_declaration_timestamp: string
          age_range: string
          consent_evidence_data: Json
          consent_store: boolean
          consent_timestamp: string
          consent_train: boolean
          country: string
          created_at: string
          device_info: string
          digital_signature: string
          email: string
          full_name: string
          id: string
          ip_address: string
          migrated_from: string
          region: string
          session_pseudonym: string
          user_agent: string
          withdrawal_reason: string
          withdrawn_at: string
        }[]
      }
      invalidate_admin_session: { Args: { token: string }; Returns: undefined }
      log_consent_evidence_access: {
        Args: { p_consent_evidence_id: string; p_session_pseudonym: string }
        Returns: undefined
      }
      validate_admin_login: {
        Args: { login_email: string; login_password: string }
        Returns: {
          admin_email: string
          admin_full_name: string
          admin_role: Database["public"]["Enums"]["admin_role"]
          admin_user_id: string
          expires_at: string
          session_token: string
        }[]
      }
      validate_admin_session: {
        Args: { token: string }
        Returns: {
          admin_email: string
          admin_full_name: string
          admin_role: Database["public"]["Enums"]["admin_role"]
          admin_user_id: string
          is_active: boolean
        }[]
      }
    }
    Enums: {
      admin_role: "admin" | "viewer" | "analyst"
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
      admin_role: ["admin", "viewer", "analyst"],
    },
  },
} as const
