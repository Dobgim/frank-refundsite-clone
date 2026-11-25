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
  /** Signs in and returns where the user should land: the admin console or the member dashboard. */
  signIn: (email: string, password: string) => Promise<'/admin' | '/dashboard'>
  signUp: (details: SignUpDetails) => Promise<void>
  resendConfirmation: (email: string) => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
