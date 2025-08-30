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
      grades: {
        Row: {
          created_at: string
          date_received: string
          grade: number
          id: string
          notes: string | null
          subject_id: string
          title: string
          type: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          date_received?: string
          grade: number
          id?: string
          notes?: string | null
          subject_id: string
          title: string
          type?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          date_received?: string
          grade?: number
          id?: string
          notes?: string | null
          subject_id?: string
          title?: string
          type?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          completed: boolean | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          subject_id: string
          submitted_at: string | null
          time_period: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          subject_id: string
          submitted_at?: string | null
          time_period?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          subject_id?: string
          submitted_at?: string | null
          time_period?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_objectives: {
        Row: {
          completed: boolean | null
          created_at: string
          description: string | null
          id: string
          order_index: number | null
          subtopic_id: string | null
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          subtopic_id?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          subtopic_id?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          subject_id: string | null
          tags: string[] | null
          time_period: string | null
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          subject_id?: string | null
          tags?: string[] | null
          time_period?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          subject_id?: string | null
          tags?: string[] | null
          time_period?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          grade_level: string | null
          id: string
          school: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          grade_level?: string | null
          id?: string
          school?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          grade_level?: string | null
          id?: string
          school?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resource_attachments: {
        Row: {
          created_at: string
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          link_description: string | null
          link_url: string | null
          resource_type: string
          subtopic_id: string | null
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          link_description?: string | null
          link_url?: string | null
          resource_type: string
          subtopic_id?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          link_description?: string | null
          link_url?: string | null
          resource_type?: string
          subtopic_id?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string
          credits: number | null
          current_grade: number | null
          id: string
          name: string
          room: string | null
          target_grade: number | null
          teacher: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          credits?: number | null
          current_grade?: number | null
          id?: string
          name: string
          room?: string | null
          target_grade?: number | null
          teacher?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          credits?: number | null
          current_grade?: number | null
          id?: string
          name?: string
          room?: string | null
          target_grade?: number | null
          teacher?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subtopics: {
        Row: {
          completed: boolean | null
          created_at: string
          description: string | null
          id: string
          order_index: number | null
          title: string
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          title: string
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          title?: string
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      syllabus_topics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_index: number | null
          subject_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          subject_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          subject_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      syllabus_milestones: {
        Row: {
          completed: boolean | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          milestone_type: string
          order_index: number | null
          subject_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          milestone_type: string
          order_index?: number | null
          subject_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          milestone_type?: string
          order_index?: number | null
          subject_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          subject_id: string | null
          time_period: string | null
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          subject_id?: string | null
          time_period?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          subject_id?: string | null
          time_period?: string | null
          title?: string
          topic_id?: string | null
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
