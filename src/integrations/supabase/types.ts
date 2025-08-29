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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audio_metadata: {
        Row: {
          audio_format: string
          consent_store: boolean
          consent_train: boolean
          created_at: string
          device_info: string | null
          duration_ms: number
          encryption_key_version: number
          id: string
          phrase_text: string
          quality_score: number | null
          sample_rate: number
          session_pseudonym: string
        }
        Insert: {
          audio_format?: string
          consent_store?: boolean
          consent_train?: boolean
          created_at?: string
          device_info?: string | null
          duration_ms: number
          encryption_key_version?: number
          id?: string
          phrase_text: string
          quality_score?: number | null
          sample_rate: number
          session_pseudonym: string
        }
        Update: {
          audio_format?: string
          consent_store?: boolean
          consent_train?: boolean
          created_at?: string
          device_info?: string | null
          duration_ms?: number
          encryption_key_version?: number
          id?: string
          phrase_text?: string
          quality_score?: number | null
          sample_rate?: number
          session_pseudonym?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          created_at: string
          details: Json
          event_type: string
          id: string
          retention_until: string
        }
        Insert: {
          created_at?: string
          details: Json
          event_type: string
          id?: string
          retention_until?: string
        }
        Update: {
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          retention_until?: string
        }
        Relationships: []
      }
      consent_logs: {
        Row: {
          consent_store: boolean
          consent_timestamp: string
          consent_train: boolean
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          ip_address: unknown | null
          session_id: string
          updated_at: string
          user_agent: string | null
          verification_token: string | null
          withdrawn_at: string | null
        }
        Insert: {
          consent_store?: boolean
          consent_timestamp?: string
          consent_train?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          ip_address?: unknown | null
          session_id: string
          updated_at?: string
          user_agent?: string | null
          verification_token?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          consent_store?: boolean
          consent_timestamp?: string
          consent_train?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          ip_address?: unknown | null
          session_id?: string
          updated_at?: string
          user_agent?: string | null
          verification_token?: string | null
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      data_deletion_requests: {
        Row: {
          additional_info: Json | null
          completed_at: string | null
          deletion_summary: Json | null
          email: string | null
          full_name: string | null
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          request_type: string
          requested_at: string
          session_pseudonym: string
          status: string
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          additional_info?: Json | null
          completed_at?: string | null
          deletion_summary?: Json | null
          email?: string | null
          full_name?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_type: string
          requested_at?: string
          session_pseudonym: string
          status?: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          additional_info?: Json | null
          completed_at?: string | null
          deletion_summary?: Json | null
          email?: string | null
          full_name?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_type?: string
          requested_at?: string
          session_pseudonym?: string
          status?: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      encrypted_audio_files: {
        Row: {
          created_at: string
          encrypted_blob: string
          id: string
          iv: string
          metadata_id: string
          salt: string
        }
        Insert: {
          created_at?: string
          encrypted_blob: string
          id?: string
          iv: string
          metadata_id: string
          salt: string
        }
        Update: {
          created_at?: string
          encrypted_blob?: string
          id?: string
          iv?: string
          metadata_id?: string
          salt?: string
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
          created_at: string
          expires_at: string
          is_active: boolean
          key_hash: string
          rotation_reason: string | null
          version: number
        }
        Insert: {
          created_at?: string
          expires_at?: string
          is_active?: boolean
          key_hash: string
          rotation_reason?: string | null
          version: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          is_active?: boolean
          key_hash?: string
          rotation_reason?: string | null
          version?: number
        }
        Relationships: []
      }
      guest_verification_tokens: {
        Row: {
          created_at: string
          deletion_requested_at: string | null
          device_info: string | null
          email: string
          expires_at: string
          full_name: string | null
          id: string
          ip_address: unknown | null
          session_pseudonym: string
          used_for_deletion: boolean | null
          user_agent: string | null
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          deletion_requested_at?: string | null
          device_info?: string | null
          email: string
          expires_at?: string
          full_name?: string | null
          id?: string
          ip_address?: unknown | null
          session_pseudonym: string
          used_for_deletion?: boolean | null
          user_agent?: string | null
          verification_token: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          deletion_requested_at?: string | null
          device_info?: string | null
          email?: string
          expires_at?: string
          full_name?: string | null
          id?: string
          ip_address?: unknown | null
          session_pseudonym?: string
          used_for_deletion?: boolean | null
          user_agent?: string | null
          verification_token?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      membership_tests: {
        Row: {
          actual_membership: boolean
          audit_id: string
          correct_prediction: boolean
          created_at: string
          id: string
          is_member_prediction: boolean
          membership_score: number
          sample_id: string
          session_pseudonym: string
          shadow_model_confidence: number
          target_model_confidence: number
        }
        Insert: {
          actual_membership: boolean
          audit_id: string
          correct_prediction: boolean
          created_at?: string
          id?: string
          is_member_prediction: boolean
          membership_score: number
          sample_id: string
          session_pseudonym: string
          shadow_model_confidence: number
          target_model_confidence: number
        }
        Update: {
          actual_membership?: boolean
          audit_id?: string
          correct_prediction?: boolean
          created_at?: string
          id?: string
          is_member_prediction?: boolean
          membership_score?: number
          sample_id?: string
          session_pseudonym?: string
          shadow_model_confidence?: number
          target_model_confidence?: number
        }
        Relationships: [
          {
            foreignKeyName: "membership_tests_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "training_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      recordings: {
        Row: {
          audio_url: string
          consent_store: boolean | null
          consent_train: boolean | null
          created_at: string | null
          device_label: string | null
          duration_ms: number | null
          format: string | null
          id: string
          phrase_text: string | null
          sample_rate: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          audio_url: string
          consent_store?: boolean | null
          consent_train?: boolean | null
          created_at?: string | null
          device_label?: string | null
          duration_ms?: number | null
          format?: string | null
          id?: string
          phrase_text?: string | null
          sample_rate?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          audio_url?: string
          consent_store?: boolean | null
          consent_train?: boolean | null
          created_at?: string | null
          device_label?: string | null
          duration_ms?: number | null
          format?: string | null
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
          created_at: string
          encrypted_session_id: string
          id: string
          last_accessed: string | null
          mapping_iv: string
          mapping_salt: string
          session_pseudonym: string
        }
        Insert: {
          created_at?: string
          encrypted_session_id: string
          id?: string
          last_accessed?: string | null
          mapping_iv: string
          mapping_salt: string
          session_pseudonym: string
        }
        Update: {
          created_at?: string
          encrypted_session_id?: string
          id?: string
          last_accessed?: string | null
          mapping_iv?: string
          mapping_salt?: string
          session_pseudonym?: string
        }
        Relationships: []
      }
      storage_keys: {
        Row: {
          bucket_id: string
          created_at: string
          encryption_algorithm: string
          expires_at: string
          id: string
          is_active: boolean
          key_hash: string
          key_version: number
          rotation_reason: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string
          encryption_algorithm?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          key_version: number
          rotation_reason?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string
          encryption_algorithm?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          key_version?: number
          rotation_reason?: string | null
        }
        Relationships: []
      }
      training_audits: {
        Row: {
          audit_results: Json
          audit_type: string
          calculated_risk: number | null
          completed_at: string | null
          created_at: string
          eipd_report: Json | null
          id: string
          pipeline_blocked: boolean
          review_notes: string | null
          reviewed_by: string | null
          risk_level: string | null
          risk_threshold: number
          sample_size: number
          training_batch_id: string
        }
        Insert: {
          audit_results: Json
          audit_type?: string
          calculated_risk?: number | null
          completed_at?: string | null
          created_at?: string
          eipd_report?: Json | null
          id?: string
          pipeline_blocked?: boolean
          review_notes?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          risk_threshold?: number
          sample_size: number
          training_batch_id: string
        }
        Update: {
          audit_results?: Json
          audit_type?: string
          calculated_risk?: number | null
          completed_at?: string | null
          created_at?: string
          eipd_report?: Json | null
          id?: string
          pipeline_blocked?: boolean
          review_notes?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          risk_threshold?: number
          sample_size?: number
          training_batch_id?: string
        }
        Relationships: []
      }
      training_pipelines: {
        Row: {
          audit_passed: boolean
          batch_count: number
          blocked_reason: string | null
          completed_at: string | null
          consent_verified: boolean
          created_at: string
          dpo_approval: string | null
          eipd_approved: boolean
          id: string
          pipeline_name: string
          started_at: string | null
          status: string
          total_samples: number
          training_config: Json
        }
        Insert: {
          audit_passed?: boolean
          batch_count?: number
          blocked_reason?: string | null
          completed_at?: string | null
          consent_verified?: boolean
          created_at?: string
          dpo_approval?: string | null
          eipd_approved?: boolean
          id?: string
          pipeline_name: string
          started_at?: string | null
          status?: string
          total_samples?: number
          training_config: Json
        }
        Update: {
          audit_passed?: boolean
          batch_count?: number
          blocked_reason?: string | null
          completed_at?: string | null
          consent_verified?: boolean
          created_at?: string
          dpo_approval?: string | null
          eipd_approved?: boolean
          id?: string
          pipeline_name?: string
          started_at?: string | null
          status?: string
          total_samples?: number
          training_config?: Json
        }
        Relationships: []
      }
      unlearning_jobs: {
        Row: {
          completed_at: string | null
          consent_log_id: string
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          consent_log_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          consent_log_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "unlearning_jobs_consent_log_id_fkey"
            columns: ["consent_log_id"]
            isOneToOne: false
            referencedRelation: "consent_logs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_membership_risk: {
        Args: { audit_id_param: string }
        Returns: number
      }
      create_worm_backup: {
        Args: {
          backup_name: string
          retention_years?: number
          source_bucket: string
        }
        Returns: string
      }
      evaluate_pipeline_risk: {
        Args: { audit_id_param: string; threshold?: number }
        Returns: boolean
      }
      generate_pseudonym: {
        Args: { original_session_id: string }
        Returns: string
      }
      get_risk_level: {
        Args: { risk_score: number }
        Returns: string
      }
      rotate_encryption_key: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      rotate_storage_key: {
        Args: { target_bucket_id: string }
        Returns: number
      }
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
