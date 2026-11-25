import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { AuthContext, type AuthContextValue } from './AuthContext'

// Account emails are sent by Supabase Auth through the project's custom SMTP
// (info@whitehillesettlement.online). The email templates link to this site's
// /auth/confirm and /reset-password pages, which verify the token hash.
const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin

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
      const { error } = await getSupabase().auth.signUp({
        email,
        password,
        options: { data: profile, emailRedirectTo: `${siteUrl}/login` },
      })
      if (error) throw error
    },
    async resendConfirmation(email) {
      const { error } = await getSupabase().auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: `${siteUrl}/login` },
      })
      if (error) throw error
    },
    async signOut() {
      const { error } = await getSupabase().auth.signOut()
      if (error) throw error
    },
    async requestPasswordReset(email) {
      const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${siteUrl}/reset-password`,
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
