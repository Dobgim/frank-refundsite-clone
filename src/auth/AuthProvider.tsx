import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { AuthContext, type AuthContextValue } from './AuthContext'

/** Account emails are sent by our server function from the business mailbox, not by Supabase. */
async function postAuthEmail(payload: Record<string, unknown>) {
  const response = await fetch('/api/auth-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (response.ok) return
  const result: unknown = await response.json().catch(() => null)
  const message = typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
    ? result.error
    : 'Something went wrong. Please try again.'
  throw new Error(message)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const client = getSupabase()
    let active = true
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) console.error('Unable to restore the Supabase session:', error.message)
      setSession(data.session)
      setIsLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextValue = {
    session,
    isLoading,
    isConfigured: isSupabaseConfigured,
    isAdmin: session?.user.app_metadata.role === 'admin',
    async signIn(email, password) {
      const { data, error } = await getSupabase().auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
      if (error) throw error
      return data.user.app_metadata.role === 'admin' ? '/admin' : '/dashboard'
    },
    async signUp({ email, password, profile }) {
      await postAuthEmail({ action: 'signup', email, password, profile })
    },
    async resendConfirmation(email) {
      await postAuthEmail({ action: 'resend', email })
    },
    async signOut() {
      const { error } = await getSupabase().auth.signOut()
      if (error) throw error
    },
    async requestPasswordReset(email) {
      await postAuthEmail({ action: 'recovery', email })
    },
    async updatePassword(password) {
      const { error } = await getSupabase().auth.updateUser({ password })
      if (error) throw error
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
