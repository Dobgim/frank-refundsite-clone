export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          middle_name: string
          username: string
          phone: string
          country: string
          city: string
          account_type: string
          currency: string
          account_purpose: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string
          last_name?: string
          middle_name?: string
          username?: string
          phone?: string
          country?: string
          city?: string
          account_type?: string
          currency?: string
          account_purpose?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          first_name?: string
          last_name?: string
          middle_name?: string
          username?: string
          phone?: string
          country?: string
          city?: string
          account_type?: string
          currency?: string
          account_purpose?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
