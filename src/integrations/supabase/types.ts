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
      exam_results: {
        Row: {
          biomarker_name: string
          category: string | null
          created_at: string | null
          deviation_percentage: number | null
          exam_id: string
          id: string
          layman_explanation: string | null
          observation: string | null
          possible_causes: Json | null
          reference_max: number | null
          reference_min: number | null
          status: Database["public"]["Enums"]["biomarker_status"]
          unit: string | null
          value: string
          value_numeric: number | null
        }
        Insert: {
          biomarker_name: string
          category?: string | null
          created_at?: string | null
          deviation_percentage?: number | null
          exam_id: string
          id?: string
          layman_explanation?: string | null
          observation?: string | null
          possible_causes?: Json | null
          reference_max?: number | null
          reference_min?: number | null
          status: Database["public"]["Enums"]["biomarker_status"]
          unit?: string | null
          value: string
          value_numeric?: number | null
        }
        Update: {
          biomarker_name?: string
          category?: string | null
          created_at?: string | null
          deviation_percentage?: number | null
          exam_id?: string
          id?: string
          layman_explanation?: string | null
          observation?: string | null
          possible_causes?: Json | null
          reference_max?: number | null
          reference_min?: number | null
          status?: Database["public"]["Enums"]["biomarker_status"]
          unit?: string | null
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
          clinical_analysis: Json | null
          created_at: string | null
          exam_date: string | null
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
          clinical_analysis?: Json | null
          created_at?: string | null
          exam_date?: string | null
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
          clinical_analysis?: Json | null
          created_at?: string | null
          exam_date?: string | null
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
      patients: {
        Row: {
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
          full_name: string
          id: string
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          crm?: string | null
          full_name: string
          id: string
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          crm?: string | null
          full_name?: string
          id?: string
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      biomarker_status: "normal" | "alto" | "baixo" | "alterado"
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
      biomarker_status: ["normal", "alto", "baixo", "alterado"],
      processing_status: ["uploading", "processing", "completed", "error"],
    },
  },
} as const
