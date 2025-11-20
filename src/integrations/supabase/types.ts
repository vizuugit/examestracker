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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          related_invitation_id: string | null
          title: string
          type: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          related_invitation_id?: string | null
          title: string
          type: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          related_invitation_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_related_invitation_id_fkey"
            columns: ["related_invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      biomarker_category_overrides: {
        Row: {
          biomarker_name: string
          category: string
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: string
          updated_at: string | null
        }
        Insert: {
          biomarker_name: string
          category: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          biomarker_name?: string
          category?: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      biomarker_duplicates: {
        Row: {
          biomarker_name: string
          conflict_type: string
          conflicting_values: Json
          created_at: string | null
          exam_id: string | null
          id: string
          resolution_notes: string | null
          resolved: boolean | null
        }
        Insert: {
          biomarker_name: string
          conflict_type: string
          conflicting_values: Json
          created_at?: string | null
          exam_id?: string | null
          id?: string
          resolution_notes?: string | null
          resolved?: boolean | null
        }
        Update: {
          biomarker_name?: string
          conflict_type?: string
          conflicting_values?: Json
          created_at?: string | null
          exam_id?: string | null
          id?: string
          resolution_notes?: string | null
          resolved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "biomarker_duplicates_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      biomarker_variations: {
        Row: {
          active: boolean | null
          biomarker_normalized_name: string
          category: string | null
          created_at: string | null
          created_by: string | null
          id: string
          unit: string | null
          updated_at: string | null
          variation: string
        }
        Insert: {
          active?: boolean | null
          biomarker_normalized_name: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          unit?: string | null
          updated_at?: string | null
          variation: string
        }
        Update: {
          active?: boolean | null
          biomarker_normalized_name?: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          unit?: string | null
          updated_at?: string | null
          variation?: string
        }
        Relationships: []
      }
      category_display_order: {
        Row: {
          category_key: string
          created_at: string | null
          created_by: string | null
          display_order: number
          id: string
          updated_at: string | null
        }
        Insert: {
          category_key: string
          created_at?: string | null
          created_by?: string | null
          display_order: number
          id?: string
          updated_at?: string | null
        }
        Update: {
          category_key?: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      corrections: {
        Row: {
          ai_value: string | null
          correction_type: string | null
          created_at: string | null
          exam_id: string
          field_name: string
          id: string
          text_sample: string | null
          updated_at: string | null
          used_for_training: boolean | null
          user_id: string
          user_value: string
        }
        Insert: {
          ai_value?: string | null
          correction_type?: string | null
          created_at?: string | null
          exam_id: string
          field_name: string
          id?: string
          text_sample?: string | null
          updated_at?: string | null
          used_for_training?: boolean | null
          user_id: string
          user_value: string
        }
        Update: {
          ai_value?: string | null
          correction_type?: string | null
          created_at?: string | null
          exam_id?: string
          field_name?: string
          id?: string
          text_sample?: string | null
          updated_at?: string | null
          used_for_training?: boolean | null
          user_id?: string
          user_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "corrections_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          biomarker_name: string
          category: string | null
          corrected_at: string | null
          created_at: string | null
          deviation_percentage: number | null
          exam_id: string
          id: string
          layman_explanation: string | null
          manually_corrected: boolean | null
          normalization_confidence: number | null
          normalization_type: string | null
          observation: string | null
          original_name: string | null
          possible_causes: Json | null
          reference_max: number | null
          reference_min: number | null
          status: Database["public"]["Enums"]["biomarker_status"]
          unit: string | null
          validation_warnings: Json | null
          value: string
          value_numeric: number | null
        }
        Insert: {
          biomarker_name: string
          category?: string | null
          corrected_at?: string | null
          created_at?: string | null
          deviation_percentage?: number | null
          exam_id: string
          id?: string
          layman_explanation?: string | null
          manually_corrected?: boolean | null
          normalization_confidence?: number | null
          normalization_type?: string | null
          observation?: string | null
          original_name?: string | null
          possible_causes?: Json | null
          reference_max?: number | null
          reference_min?: number | null
          status: Database["public"]["Enums"]["biomarker_status"]
          unit?: string | null
          validation_warnings?: Json | null
          value: string
          value_numeric?: number | null
        }
        Update: {
          biomarker_name?: string
          category?: string | null
          corrected_at?: string | null
          created_at?: string | null
          deviation_percentage?: number | null
          exam_id?: string
          id?: string
          layman_explanation?: string | null
          manually_corrected?: boolean | null
          normalization_confidence?: number | null
          normalization_type?: string | null
          observation?: string | null
          original_name?: string | null
          possible_causes?: Json | null
          reference_max?: number | null
          reference_min?: number | null
          status?: Database["public"]["Enums"]["biomarker_status"]
          unit?: string | null
          validation_warnings?: Json | null
          value?: string
          value_numeric?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          alerts: Json | null
          aws_file_key: string
          aws_file_name: string
          birth_date: string | null
          clinical_analysis: Json | null
          created_at: string | null
          exam_date: string | null
          filename: string | null
          health_score: number | null
          id: string
          laboratory: string | null
          matching_type: string | null
          patient_id: string | null
          patient_name_extracted: string | null
          processed_at: string | null
          processing_status:
            | Database["public"]["Enums"]["processing_status"]
            | null
          raw_aws_response: Json | null
          recommendations: Json | null
          risk_category: string | null
          total_biomarkers: number | null
          trends: Json | null
          updated_at: string | null
          upload_date: string | null
          uploaded_by: string
        }
        Insert: {
          alerts?: Json | null
          aws_file_key: string
          aws_file_name: string
          birth_date?: string | null
          clinical_analysis?: Json | null
          created_at?: string | null
          exam_date?: string | null
          filename?: string | null
          health_score?: number | null
          id?: string
          laboratory?: string | null
          matching_type?: string | null
          patient_id?: string | null
          patient_name_extracted?: string | null
          processed_at?: string | null
          processing_status?:
            | Database["public"]["Enums"]["processing_status"]
            | null
          raw_aws_response?: Json | null
          recommendations?: Json | null
          risk_category?: string | null
          total_biomarkers?: number | null
          trends?: Json | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by: string
        }
        Update: {
          alerts?: Json | null
          aws_file_key?: string
          aws_file_name?: string
          birth_date?: string | null
          clinical_analysis?: Json | null
          created_at?: string | null
          exam_date?: string | null
          filename?: string | null
          health_score?: number | null
          id?: string
          laboratory?: string | null
          matching_type?: string | null
          patient_id?: string | null
          patient_name_extracted?: string | null
          processed_at?: string | null
          processing_status?:
            | Database["public"]["Enums"]["processing_status"]
            | null
          raw_aws_response?: Json | null
          recommendations?: Json | null
          risk_category?: string | null
          total_biomarkers?: number | null
          trends?: Json | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          full_name: string | null
          id: string
          invited_by: string | null
          invited_role: Database["public"]["Enums"]["app_role"]
          last_resent_at: string | null
          metadata: Json | null
          resent_count: number | null
          specialty: string | null
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          invited_role?: Database["public"]["Enums"]["app_role"]
          last_resent_at?: string | null
          metadata?: Json | null
          resent_count?: number | null
          specialty?: string | null
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          invited_role?: Database["public"]["Enums"]["app_role"]
          last_resent_at?: string | null
          metadata?: Json | null
          resent_count?: number | null
          specialty?: string | null
          status?: string
          token?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string
          id: string
          medical_conditions: string[] | null
          phone: string | null
          professional_id: string
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          id?: string
          medical_conditions?: string[] | null
          phone?: string | null
          professional_id: string
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          id?: string
          medical_conditions?: string[] | null
          phone?: string | null
          professional_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          crm: string | null
          first_login_completed: boolean | null
          full_name: string
          id: string
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          crm?: string | null
          first_login_completed?: boolean | null
          full_name: string
          id: string
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          crm?: string | null
          first_login_completed?: boolean | null
          full_name?: string
          id?: string
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rejected_biomarkers: {
        Row: {
          created_at: string | null
          exam_id: string | null
          id: string
          original_name: string
          original_value: string | null
          rejection_reason: string
          similarity_score: number | null
          suggestions: string[] | null
        }
        Insert: {
          created_at?: string | null
          exam_id?: string | null
          id?: string
          original_name: string
          original_value?: string | null
          rejection_reason: string
          similarity_score?: number | null
          suggestions?: string[] | null
        }
        Update: {
          created_at?: string | null
          exam_id?: string | null
          id?: string
          original_name?: string
          original_value?: string | null
          rejection_reason?: string
          similarity_score?: number | null
          suggestions?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "rejected_biomarkers_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "professional" | "assistant"
      biomarker_status:
        | "normal"
        | "alto"
        | "baixo"
        | "alterado"
        | "indeterminado"
      processing_status: "uploading" | "processing" | "completed" | "error"
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
      app_role: ["admin", "professional", "assistant"],
      biomarker_status: [
        "normal",
        "alto",
        "baixo",
        "alterado",
        "indeterminado",
      ],
      processing_status: ["uploading", "processing", "completed", "error"],
    },
  },
} as const
