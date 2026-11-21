import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type SignUpDetails = {
  email: string
  password: string
  profile: Record<string, string>
}

export type AuthContextValue = {
  session: Session | null
  isLoading: boolean
  isConfigured: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (details: SignUpDetails) => Promise<boolean>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
