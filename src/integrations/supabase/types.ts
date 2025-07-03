export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bio_banks: {
        Row: {
          collection_date: string
          created_at: string | null
          id: string
          notes: string | null
          patient_id: string | null
          sample_id: string
          sample_type: string
          status: string | null
          storage_location: string | null
          temperature: number | null
          volume_ml: number | null
        }
        Insert: {
          collection_date: string
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          sample_id: string
          sample_type: string
          status?: string | null
          storage_location?: string | null
          temperature?: number | null
          volume_ml?: number | null
        }
        Update: {
          collection_date?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          sample_id?: string
          sample_type?: string
          status?: string | null
          storage_location?: string | null
          temperature?: number | null
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bio_banks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_allocation: {
        Row: {
          category: string
          color: string | null
          created_at: string | null
          id: string
          percentage: number
          project_id: string | null
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string | null
          id?: string
          percentage: number
          project_id?: string | null
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string | null
          id?: string
          percentage?: number
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_allocation_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          affiliation: string | null
          assigned_member: string | null
          created_at: string | null
          created_by: string
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string | null
          id: string
          location: string | null
          speakers: string | null
          start_time: string | null
          target_audience: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          affiliation?: string | null
          assigned_member?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string | null
          id?: string
          location?: string | null
          speakers?: string | null
          start_time?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          affiliation?: string | null
          assigned_member?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string | null
          id?: string
          location?: string | null
          speakers?: string | null
          start_time?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dbs_samples: {
        Row: {
          analyzed_by: string | null
          card_type: string | null
          collection_date: string
          collection_location: string | null
          collection_time: string | null
          created_at: string | null
          id: string
          notes: string | null
          patient_id: string | null
          sample_id: string
          spots_count: number | null
          status: string | null
          storage_location: string | null
        }
        Insert: {
          analyzed_by?: string | null
          card_type?: string | null
          collection_date: string
          collection_location?: string | null
          collection_time?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          sample_id: string
          spots_count?: number | null
          status?: string | null
          storage_location?: string | null
        }
        Update: {
          analyzed_by?: string | null
          card_type?: string | null
          collection_date?: string
          collection_location?: string | null
          collection_time?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          sample_id?: string
          spots_count?: number | null
          status?: string | null
          storage_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dbs_samples_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_items: {
        Row: {
          created_at: string | null
          id: string
          name: string
          serial_number: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          serial_number: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          serial_number?: string
        }
        Relationships: []
      }
      equipment_reservations: {
        Row: {
          created_at: string | null
          date: string
          end_time: string
          equipment: string
          id: string
          project: string
          reserved_by: string | null
          start_time: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time: string
          equipment: string
          id?: string
          project: string
          reserved_by?: string | null
          start_time: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string
          equipment?: string
          id?: string
          project?: string
          reserved_by?: string | null
          start_time?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      equipment_tracking: {
        Row: {
          check_out_time: string | null
          created_at: string | null
          equipment_id: string | null
          id: string
          last_maintenance: string | null
          location: string | null
          status: string | null
          user_name: string | null
        }
        Insert: {
          check_out_time?: string | null
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          last_maintenance?: string | null
          location?: string | null
          status?: string | null
          user_name?: string | null
        }
        Update: {
          check_out_time?: string | null
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          last_maintenance?: string | null
          location?: string | null
          status?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_tracking_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          conditionnement: string | null
          created_at: string | null
          date_preemption: string | null
          fabriquant: string | null
          id: string
          nom_vernaculaire: string | null
          numero: string | null
          numero_lot_catalogue: string | null
          observation_commentaire: string | null
          pays: string | null
          produit: string
          projet_chimique: string | null
          projet_source: string | null
          quantite_restante: number | null
          rayon: string | null
          reference: string | null
          seuil_alerte: number | null
          temperature_conservation: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          conditionnement?: string | null
          created_at?: string | null
          date_preemption?: string | null
          fabriquant?: string | null
          id?: string
          nom_vernaculaire?: string | null
          numero?: string | null
          numero_lot_catalogue?: string | null
          observation_commentaire?: string | null
          pays?: string | null
          produit: string
          projet_chimique?: string | null
          projet_source?: string | null
          quantite_restante?: number | null
          rayon?: string | null
          reference?: string | null
          seuil_alerte?: number | null
          temperature_conservation?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          conditionnement?: string | null
          created_at?: string | null
          date_preemption?: string | null
          fabriquant?: string | null
          id?: string
          nom_vernaculaire?: string | null
          numero?: string | null
          numero_lot_catalogue?: string | null
          observation_commentaire?: string | null
          pays?: string | null
          produit?: string
          projet_chimique?: string | null
          projet_source?: string | null
          quantite_restante?: number | null
          rayon?: string | null
          reference?: string | null
          seuil_alerte?: number | null
          temperature_conservation?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      patient_lab_results: {
        Row: {
          approved_by: string | null
          created_at: string
          id: string
          patient_id: string | null
          status: string | null
          test_name: string
          units: string | null
          updated_at: string
          value: number | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          id?: string
          patient_id?: string | null
          status?: string | null
          test_name: string
          units?: string | null
          updated_at?: string
          value?: number | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          id?: string
          patient_id?: string | null
          status?: string | null
          test_name?: string
          units?: string | null
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_lab_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          age: number | null
          consent_date: string | null
          consent_obtained: boolean | null
          created_at: string | null
          date_of_birth: string | null
          diagnosis: string | null
          dna: string | null
          email: string | null
          ethnicity: string | null
          father_name: string | null
          filter_paper: number | null
          gender: string | null
          glycemia: number | null
          glycerolytes: string | null
          height: number | null
          hemoglobin: number | null
          id: string
          last_visit: string | null
          malaria_type: string | null
          medical_record_number: string | null
          mother_name: string | null
          name: string
          observations: string | null
          parasitaemia: number | null
          patient_form_completed: boolean | null
          phone: string | null
          place_of_birth: string | null
          project: string | null
          quarter: string | null
          sample_collection_date: string | null
          sample_type: string | null
          samples_stored: boolean | null
          serums: number | null
          site: string | null
          slides: number | null
          temperature: number | null
          treatment_type: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          consent_date?: string | null
          consent_obtained?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          diagnosis?: string | null
          dna?: string | null
          email?: string | null
          ethnicity?: string | null
          father_name?: string | null
          filter_paper?: number | null
          gender?: string | null
          glycemia?: number | null
          glycerolytes?: string | null
          height?: number | null
          hemoglobin?: number | null
          id?: string
          last_visit?: string | null
          malaria_type?: string | null
          medical_record_number?: string | null
          mother_name?: string | null
          name: string
          observations?: string | null
          parasitaemia?: number | null
          patient_form_completed?: boolean | null
          phone?: string | null
          place_of_birth?: string | null
          project?: string | null
          quarter?: string | null
          sample_collection_date?: string | null
          sample_type?: string | null
          samples_stored?: boolean | null
          serums?: number | null
          site?: string | null
          slides?: number | null
          temperature?: number | null
          treatment_type?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          consent_date?: string | null
          consent_obtained?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          diagnosis?: string | null
          dna?: string | null
          email?: string | null
          ethnicity?: string | null
          father_name?: string | null
          filter_paper?: number | null
          gender?: string | null
          glycemia?: number | null
          glycerolytes?: string | null
          height?: number | null
          hemoglobin?: number | null
          id?: string
          last_visit?: string | null
          malaria_type?: string | null
          medical_record_number?: string | null
          mother_name?: string | null
          name?: string
          observations?: string | null
          parasitaemia?: number | null
          patient_form_completed?: boolean | null
          phone?: string | null
          place_of_birth?: string | null
          project?: string | null
          quarter?: string | null
          sample_collection_date?: string | null
          sample_type?: string | null
          samples_stored?: boolean | null
          serums?: number | null
          site?: string | null
          slides?: number | null
          temperature?: number | null
          treatment_type?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: Json | null
          budget_founder: string | null
          co_principal_investigator: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          organizations: string[] | null
          principal_investigator: string | null
          status: string | null
          team: string[] | null
          updated_at: string | null
        }
        Insert: {
          budget?: Json | null
          budget_founder?: string | null
          co_principal_investigator?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organizations?: string[] | null
          principal_investigator?: string | null
          status?: string | null
          team?: string[] | null
          updated_at?: string | null
        }
        Update: {
          budget?: Json | null
          budget_founder?: string | null
          co_principal_investigator?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organizations?: string[] | null
          principal_investigator?: string | null
          status?: string | null
          team?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      research_comments: {
        Row: {
          author_name: string
          content: string
          created_at: string | null
          dataset_id: string | null
          id: string
        }
        Insert: {
          author_name: string
          content: string
          created_at?: string | null
          dataset_id?: string | null
          id?: string
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string | null
          dataset_id?: string | null
          id?: string
        }
        Relationships: []
      }
      research_papers: {
        Row: {
          abstract: string | null
          authors: string[]
          categories: string[] | null
          created_at: string
          created_by: string | null
          doi: string | null
          file_path: string | null
          file_url: string | null
          id: string
          journal: string | null
          keywords: string[] | null
          publication_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          abstract?: string | null
          authors: string[]
          categories?: string[] | null
          created_at?: string
          created_by?: string | null
          doi?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          journal?: string | null
          keywords?: string[] | null
          publication_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          abstract?: string | null
          authors?: string[]
          categories?: string[] | null
          created_at?: string
          created_by?: string | null
          doi?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          journal?: string | null
          keywords?: string[] | null
          publication_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      spending: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date?: string
          description: string
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spending_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          recorded_by: string | null
          status: string
          team_member_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status: string
          team_member_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status?: string
          team_member_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
