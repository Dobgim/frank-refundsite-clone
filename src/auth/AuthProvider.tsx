import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { AuthContext, type AuthContextValue } from './AuthContext'

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
      const { error } = await getSupabase().auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    async signUp({ email, password, profile }) {
      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: {
          data: profile,
        },
      })
      if (error) throw error
      return Boolean(data.session)
    },
    async signOut() {
      const { error } = await getSupabase().auth.signOut()
      if (error) throw error
    },
    async requestPasswordReset(email) {
      const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
    },
    async updatePassword(password) {
      const { error } = await getSupabase().auth.updateUser({ password })
      if (error) throw error
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
