import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, ShieldCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getSupabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'
import { useAuth } from '../auth/useAuth'
import '../dashboard.css'
import '../admin.css'

type Profile = Database['public']['Tables']['profiles']['Row']

export function AdminPage() {
  const { signOut, session } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProfiles = useCallback(async () => {
    try {
      const { data, error: queryError } = await getSupabase()
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (queryError) {
        setError(queryError.message)
      } else {
        setProfiles(data)
      }
    } catch (queryFailure) {
      setError(queryFailure instanceof Error ? queryFailure.message : 'Unable to load member profiles.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfiles()
  }, [loadProfiles])

  async function handleSignOut() {
    try {
      await signOut()
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Unable to sign out.')
    }
  }

  function handleRefresh() {
    setIsLoading(true)
    setError('')
    void loadProfiles()
  }

  return (
    <div className="dashboard-shell admin-shell">
      <aside className="dashboard-sidebar admin-sidebar">
        <Link className="dashboard-brand" to="/"><span className="dashboard-brand-mark"><ShieldCheck size={21} /></span><span>Whitehill<span className="brand-accent">Admin</span></span></Link>
        <div className="dashboard-portal-label">ADMINISTRATION</div>
        <nav className="dashboard-nav" aria-label="Admin navigation">
          <span className="dashboard-nav-link nav-active"><Users size={17} /><span>Members</span></span>
        </nav>
        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-user-card">
            <span className="dashboard-avatar">A</span>
            <span className="dashboard-user-name"><strong>Administrator</strong><small>{session?.user.email}</small></span>
            <span className="dashboard-user-role">ADMIN</span>
          </div>
          <button className="dashboard-signout" type="button" onClick={handleSignOut}>Sign out</button>
        </div>
      </aside>
      <main className="dashboard-main">
        <div className="dashboard-content">
          <header className="dashboard-page-header">
            <div><p className="dashboard-demo-tag"><span /> ADMIN CONSOLE</p><h1>Member overview</h1><p className="dashboard-subtitle">View registered member profiles. Authentication credentials are never exposed here.</p></div>
            <button className="dashboard-primary-button" type="button" onClick={handleRefresh} disabled={isLoading}><RefreshCw size={16} /> Refresh</button>
          </header>
          <section className="admin-summary" aria-label="Member summary">
            <div className="admin-summary-icon"><Users size={20} /></div>
            <div><span>Registered profiles</span><strong>{profiles.length}</strong></div>
          </section>
          <section className="dashboard-panel dashboard-page-panel admin-members">
            <div className="dashboard-panel-heading"><div><h2>Members</h2><p>Profile details are protected by Supabase row-level security.</p></div></div>
            {error && <p className="admin-error" role="alert">{error}. Apply the SQL setup in supabase/schema.sql and verify your admin role.</p>}
            {isLoading ? <p className="admin-empty">Loading members…</p> : profiles.length === 0 ? <p className="admin-empty">No registered profiles yet.</p> : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Username</th><th>Country</th><th>Joined</th></tr></thead>
                  <tbody>{profiles.map((profile) => (
                    <tr key={profile.id}>
                      <td>{[profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ') || '—'}</td>
                      <td>{profile.email}</td>
                      <td>{profile.username || '—'}</td>
                      <td>{profile.country || '—'}</td>
                      <td>{new Date(profile.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
