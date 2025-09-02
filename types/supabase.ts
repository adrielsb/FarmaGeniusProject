export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string | null
          email: string
          password: string | null
          email_verified: string | null
          image: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          email: string
          password?: string | null
          email_verified?: string | null
          image?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          password?: string | null
          email_verified?: string | null
          image?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          type: string
          provider: string
          provider_account_id: string
          refresh_token: string | null
          access_token: string | null
          expires_at: number | null
          token_type: string | null
          scope: string | null
          id_token: string | null
          session_state: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          provider: string
          provider_account_id: string
          refresh_token?: string | null
          access_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
          session_state?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          provider?: string
          provider_account_id?: string
          refresh_token?: string | null
          access_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
          session_state?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          session_token: string
          user_id: string
          expires: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_token: string
          user_id: string
          expires: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_token?: string
          user_id?: string
          expires?: string
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          title: string
          date: string
          status: string
          user_id: string
          created_at: string
          updated_at: string
          diario_file_name: string | null
          controle_file_name: string | null
          total_quantity: number
          total_value: number
          solid_count: number
          top_seller: string | null
          processed_data: any | null
          kanban_data: any | null
          sellers_data: any | null
        }
        Insert: {
          id?: string
          title: string
          date: string
          status?: string
          user_id: string
          created_at?: string
          updated_at?: string
          diario_file_name?: string | null
          controle_file_name?: string | null
          total_quantity?: number
          total_value?: number
          solid_count?: number
          top_seller?: string | null
          processed_data?: any | null
          kanban_data?: any | null
          sellers_data?: any | null
        }
        Update: {
          id?: string
          title?: string
          date?: string
          status?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          diario_file_name?: string | null
          controle_file_name?: string | null
          total_quantity?: number
          total_value?: number
          solid_count?: number
          top_seller?: string | null
          processed_data?: any | null
          kanban_data?: any | null
          sellers_data?: any | null
        }
      }
      report_items: {
        Row: {
          id: string
          report_id: string
          form_norm: string | null
          linha: string | null
          horario: string | null
          vendedor: string | null
          quantidade: number | null
          valor: number | null
          categoria: string | null
          observacoes: string | null
          source_file: string | null
          row_index: number | null
          is_mapped: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_id: string
          form_norm?: string | null
          linha?: string | null
          horario?: string | null
          vendedor?: string | null
          quantidade?: number | null
          valor?: number | null
          categoria?: string | null
          observacoes?: string | null
          source_file?: string | null
          row_index?: number | null
          is_mapped?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          form_norm?: string | null
          linha?: string | null
          horario?: string | null
          vendedor?: string | null
          quantidade?: number | null
          valor?: number | null
          categoria?: string | null
          observacoes?: string | null
          source_file?: string | null
          row_index?: number | null
          is_mapped?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      mappings: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          mapping_data: any
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          mapping_data: any
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          mapping_data?: any
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      daily_observations: {
        Row: {
          id: string
          date: string
          observation: string
          user_id: string
          author_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          observation: string
          user_id: string
          author_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          observation?: string
          user_id?: string
          author_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      production_metrics: {
        Row: {
          id: string
          user_id: string
          time_slot: string
          category: string
          capacity: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          time_slot: string
          category: string
          capacity: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          time_slot?: string
          category?: string
          capacity?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      defaulters: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string
          due_date: string
          amount: number
          status: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone: string
          due_date: string
          amount: number
          status?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string
          due_date?: string
          amount?: number
          status?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          table_name: string
          record_id: string | null
          old_values: any | null
          new_values: any | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          table_name: string
          record_id?: string | null
          old_values?: any | null
          new_values?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          table_name?: string
          record_id?: string | null
          old_values?: any | null
          new_values?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          user_id: string
          medication_name: string
          category: string | null
          current_stock: number
          min_stock: number
          max_stock: number
          unit: string
          expiry_date: string | null
          batch_number: string | null
          supplier: string | null
          last_restock_date: string | null
          cost_price: number | null
          sell_price: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          medication_name: string
          category?: string | null
          current_stock: number
          min_stock: number
          max_stock: number
          unit?: string
          expiry_date?: string | null
          batch_number?: string | null
          supplier?: string | null
          last_restock_date?: string | null
          cost_price?: number | null
          sell_price?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          medication_name?: string
          category?: string | null
          current_stock?: number
          min_stock?: number
          max_stock?: number
          unit?: string
          expiry_date?: string | null
          batch_number?: string | null
          supplier?: string | null
          last_restock_date?: string | null
          cost_price?: number | null
          sell_price?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      digital_prescriptions: {
        Row: {
          id: string
          user_id: string
          patient_name: string
          patient_cpf: string | null
          patient_phone: string | null
          doctor_name: string
          doctor_crm: string
          doctor_phone: string | null
          medications: any
          instructions: string | null
          valid_until: string
          status: string
          filled_at: string | null
          filled_by: string | null
          observations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          patient_name: string
          patient_cpf?: string | null
          patient_phone?: string | null
          doctor_name: string
          doctor_crm: string
          doctor_phone?: string | null
          medications: any
          instructions?: string | null
          valid_until: string
          status?: string
          filled_at?: string | null
          filled_by?: string | null
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          patient_name?: string
          patient_cpf?: string | null
          patient_phone?: string | null
          doctor_name?: string
          doctor_crm?: string
          doctor_phone?: string | null
          medications?: any
          instructions?: string | null
          valid_until?: string
          status?: string
          filled_at?: string | null
          filled_by?: string | null
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}