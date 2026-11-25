import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/useAuth'

export function RequireAuth({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { isAdmin, isConfigured, isLoading, session } = useAuth()
  const location = useLocation()

  if (!isConfigured) {
    return <main className="auth-config-error">Authentication is not configured. Add the Supabase environment variables and reload.</main>
  }
  if (isLoading) return <main className="auth-config-error">Checking your sign-in…</main>
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  // Administrators always use the admin console rather than the member dashboard.
  if (!adminOnly && isAdmin) return <Navigate to="/admin" replace />
  return children
}
