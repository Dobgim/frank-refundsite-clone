export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type CaseRequestType = 'claim' | 'verification' | 'loan' | 'withdrawal' | 'support'
export type CaseRequestStatus = 'submitted' | 'under_review' | 'needs_information' | 'approved' | 'declined' | 'resolved'

export type ProfileVerificationStatus = 'unverified' | 'pending' | 'approved' | 'rejected'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type VerificationDocumentType = 'id_card' | 'passport' | 'license'

export type Database = {
  public: {
    Tables: {
      case_requests: {
        Row: {
          id: string
          user_id: string
          request_type: CaseRequestType
          subject: string
          details: string
          requested_amount: number | null
          currency: string | null
          loan_term_months: number | null
          transaction_reference: string | null
          status: CaseRequestStatus
          staff_message: string | null
          created_at: string
          updated_at: string
          closed_at: string | null
        }
        Insert: {
          user_id: string
          request_type: CaseRequestType
          subject: string
          details: string
          requested_amount?: number | null
          currency?: string | null
          loan_term_months?: number | null
          transaction_reference?: string | null
        }
        Update: {
          status?: CaseRequestStatus
          staff_message?: string | null
        }
        Relationships: []
      }
      case_documents: {
        Row: {
          id: string
          request_id: string
          user_id: string
          storage_path: string
          file_name: string
          mime_type: string
          file_size: number
          created_at: string
        }
        Insert: {
          request_id: string
          user_id: string
          storage_path: string
          file_name: string
          mime_type: string
          file_size: number
        }
        Update: {
          storage_path?: string
          file_name?: string
          mime_type?: string
          file_size?: number
        }
        Relationships: []
      }
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
          verification_status: ProfileVerificationStatus
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
      identity_verifications: {
        Row: {
          id: string
          user_id: string
          document_type: VerificationDocumentType
          document_storage_path: string
          document_file_name: string
          document_back_storage_path: string | null
          document_back_file_name: string | null
          selfie_storage_path: string
          selfie_file_name: string
          status: VerificationStatus
          admin_note: string | null
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          user_id: string
          document_type: VerificationDocumentType
          document_storage_path: string
          document_file_name: string
          document_back_storage_path?: string | null
          document_back_file_name?: string | null
          selfie_storage_path: string
          selfie_file_name: string
        }
        Update: {
          status?: VerificationStatus
          admin_note?: string | null
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
