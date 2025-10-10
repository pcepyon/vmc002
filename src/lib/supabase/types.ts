export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          role: 'learner' | 'instructor'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          phone?: string | null
          role: 'learner' | 'instructor'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          role?: 'learner' | 'instructor'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      terms_agreements: {
        Row: {
          id: string
          user_id: string
          agreed_at: string
          version: string
        }
        Insert: {
          id?: string
          user_id: string
          agreed_at?: string
          version?: string
        }
        Update: {
          id?: string
          user_id?: string
          agreed_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_agreements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      courses: {
        Row: {
          id: string
          instructor_id: string
          title: string
          description: string | null
          category: string | null
          difficulty: 'beginner' | 'intermediate' | 'advanced' | null
          status: 'draft' | 'published' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          instructor_id: string
          title: string
          description?: string | null
          category?: string | null
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          instructor_id?: string
          title?: string
          description?: string | null
          category?: string | null
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          enrolled_at: string
          progress: number | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          enrolled_at?: string
          progress?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          enrolled_at?: string
          progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      assignments: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          due_date: string
          weight: number | null
          allow_late: boolean | null
          allow_resubmission: boolean | null
          status: 'draft' | 'published' | 'closed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          due_date: string
          weight?: number | null
          allow_late?: boolean | null
          allow_resubmission?: boolean | null
          status?: 'draft' | 'published' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          due_date?: string
          weight?: number | null
          allow_late?: boolean | null
          allow_resubmission?: boolean | null
          status?: 'draft' | 'published' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      submissions: {
        Row: {
          id: string
          assignment_id: string
          user_id: string
          content_text: string
          content_link: string | null
          submitted_at: string
          is_late: boolean | null
          score: number | null
          feedback: string | null
          status: 'submitted' | 'graded' | 'resubmission_required'
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          user_id: string
          content_text: string
          content_link?: string | null
          submitted_at?: string
          is_late?: boolean | null
          score?: number | null
          feedback?: string | null
          status?: 'submitted' | 'graded' | 'resubmission_required'
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          user_id?: string
          content_text?: string
          content_link?: string | null
          submitted_at?: string
          is_late?: boolean | null
          score?: number | null
          feedback?: string | null
          status?: 'submitted' | 'graded' | 'resubmission_required'
          version?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'learner' | 'instructor'
      course_status: 'draft' | 'published' | 'archived'
      assignment_status: 'draft' | 'published' | 'closed'
      submission_status: 'submitted' | 'graded' | 'resubmission_required'
      difficulty_level: 'beginner' | 'intermediate' | 'advanced'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type SupabaseUserMetadata = Record<string, unknown>;
