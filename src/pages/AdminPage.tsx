import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  Banknote,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderOpen,
  Headset,
  Landmark,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  RefreshCw,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { formatCurrency, isCurrency } from '../currency'
import { getSupabase } from '../lib/supabase'
import type { CaseRequestStatus, Database } from '../lib/database.types'
import { requestStatusLabels, requestTypeLabels } from '../lib/cases'
import '../dashboard.css'
import '../admin.css'

type AdminTab =
  | 'Dashboard'
  | 'Claims'
  | 'Verifications'
  | 'Withdrawals'
  | 'Loan applications'
  | 'Users'
  | 'Documents'
  | 'Customer service'
  | 'Case messages'
  | 'Settings'

type CaseRequest = Database['public']['Tables']['case_requests']['Row']
type CaseDocument = Database['public']['Tables']['case_documents']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type AdminProfile = Pick<Profile, 'id' | 'email' | 'first_name' | 'middle_name' | 'last_name' | 'country' | 'created_at'>

const navigation: { label: AdminTab; icon: LucideIcon }[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Claims', icon: ClipboardList },
  { label: 'Verifications', icon: BadgeCheck },
  { label: 'Withdrawals', icon: Banknote },
  { label: 'Loan applications', icon: Landmark },
  { label: 'Users', icon: Users },
  { label: 'Documents', icon: FileText },
  { label: 'Customer service', icon: Headset },
  { label: 'Case messages', icon: MessageSquareText },
  { label: 'Settings', icon: Settings },
]

const statusOptions: CaseRequestStatus[] = [
  'submitted',
  'under_review',
  'needs_information',
  'approved',
  'declined',
  'resolved',
]

const descriptions: Record<AdminTab, string> = {
  Dashboard: 'Case volume, review queue, and the most recent submissions.',
  Claims: 'Review claim requests submitted by members.',
  Verifications: 'Review verification requests and any private supporting files.',
  Withdrawals: 'Review withdrawal requests. This dashboard does not move funds.',
  'Loan applications': 'Review loan inquiries. An approval here does not create or disburse a loan.',
  Users: 'View registered member profiles.',
  Documents: 'Open private supporting files using short-lived secure links.',
  'Customer service': 'Review support requests submitted by members.',
  'Case messages': 'Review support requests and share a staff update with the member.',
  Settings: 'Review administrator access and data-handling settings.',
}

export function AdminPage() {
  const { session, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard')
  const [requests, setRequests] = useState<CaseRequest[]>([])
  const [documents, setDocuments] = useState<CaseDocument[]>([])
  const [profiles, setProfiles] = useState<AdminProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [documentError, setDocumentError] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const client = getSupabase()
      const [requestResult, profileResult, documentResult] = await Promise.all([
        client.from('case_requests').select('*').order('created_at', { ascending: false }),
        client.from('profiles').select('id, email, first_name, middle_name, last_name, country, created_at').order('created_at', { ascending: false }),
        client.from('case_documents').select('*').order('created_at', { ascending: false }),
      ])
      if (requestResult.error) throw requestResult.error
      if (profileResult.error) throw profileResult.error
      if (documentResult.error) throw documentResult.error
      setRequests(requestResult.data)
      setProfiles(profileResult.data)
      setDocuments(documentResult.data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the administration dashboard.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const profilesById = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles])
  const totalRequestedUSD = requests
    .filter((request) => request.currency === 'USD')
    .reduce((sum, request) => sum + (request.requested_amount ?? 0), 0)
  const pendingCount = requests.filter((request) => request.status === 'submitted').length
  const activeCount = requests.filter((request) => !['declined', 'resolved'].includes(request.status)).length
  const resolvedCount = requests.filter((request) => request.status === 'declined' || request.status === 'resolved').length

  const visibleRequests = useMemo(() => {
    switch (activeTab) {
      case 'Claims': return requests.filter((request) => request.request_type === 'claim')
      case 'Verifications': return requests.filter((request) => request.request_type === 'verification')
      case 'Withdrawals': return requests.filter((request) => request.request_type === 'withdrawal')
      case 'Loan applications': return requests.filter((request) => request.request_type === 'loan')
      case 'Customer service':
      case 'Case messages': return requests.filter((request) => request.request_type === 'support')
      default: return requests
    }
  }, [activeTab, requests])

  async function handleSignOut() {
    try {
      await signOut()
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Unable to sign out.')
    }
  }

  async function openDocument(document: CaseDocument) {
    setDocumentError('')
    try {
      const { data, error: signedUrlError } = await getSupabase()
        .storage
        .from('case-documents')
        .createSignedUrl(document.storage_path, 60)
      if (signedUrlError) throw signedUrlError
      setSignedUrls((current) => ({ ...current, [document.id]: data.signedUrl }))
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : 'Unable to create a secure document link.')
    }
  }

  const title = activeTab
  return (
    <div className="dashboard-shell admin-shell">
      <aside className="dashboard-sidebar admin-sidebar">
        <Link className="dashboard-brand" to="/" aria-label="Whitehill Settlement home">
          <span className="dashboard-brand-mark"><Landmark size={21} /></span>
          <span>Whitehill<span className="brand-accent">Settlement</span></span>
        </Link>
        <div className="dashboard-portal-label">ADMINISTRATION</div>
        <nav className="dashboard-nav" aria-label="Admin navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              className={`dashboard-nav-link ${activeTab === label ? 'nav-active' : ''}`}
              key={label}
              onClick={() => setActiveTab(label)}
              type="button"
            >
              <Icon size={17} />
              <span>{label}</span>
              {activeTab === label && <ArrowRight className="nav-chevron" size={15} />}
            </button>
          ))}
        </nav>
        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-user-card">
            <span className="dashboard-avatar">{session?.user.email?.slice(0, 1).toUpperCase() ?? 'A'}</span>
            <span className="dashboard-user-name"><strong>Administrator</strong><small>{session?.user.email}</small></span>
            <span className="dashboard-user-role">ADMIN</span>
          </div>
          <button className="dashboard-signout" type="button" onClick={() => void handleSignOut()}><LogOut size={15} /> Sign out</button>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-content admin-content">
          <header className="dashboard-page-header">
            <div>
              <p className="dashboard-demo-tag"><span /> ADMIN CONSOLE</p>
              <h1>{title}</h1>
              <p className="dashboard-subtitle">{descriptions[activeTab]}</p>
            </div>
            <button className="dashboard-primary-button" type="button" onClick={() => void loadData()} disabled={isLoading}>
              <RefreshCw size={16} /> Refresh
            </button>
          </header>

          <div className="admin-review-notice">
            <ShieldCheck size={18} />
            <p>Requests are for administrative review only. Statuses do not approve lending, initiate withdrawals, or move funds. Documents are private and removed 30 days after a request is closed.</p>
          </div>
          {error && <p className="admin-error" role="alert">{error}. Apply the latest SQL in supabase/schema.sql and confirm this account has the admin role.</p>}

          {activeTab === 'Dashboard' ? (
            <DashboardOverview
              requestCount={requests.length}
              pendingCount={pendingCount}
              activeCount={activeCount}
              resolvedCount={resolvedCount}
              userCount={profiles.length}
              totalRequested={totalRequestedUSD}
              requests={requests}
              isLoading={isLoading}
              profilesById={profilesById}
              onOpenClaims={() => setActiveTab('Claims')}
            />
          ) : activeTab === 'Users' ? (
            <UsersView profiles={profiles} isLoading={isLoading} />
          ) : activeTab === 'Documents' ? (
            <DocumentsView
              documents={documents}
              profilesById={profilesById}
              requests={requests}
              isLoading={isLoading}
              signedUrls={signedUrls}
              error={documentError}
              onOpen={(document) => void openDocument(document)}
            />
          ) : activeTab === 'Settings' ? (
            <AdminSettings email={session?.user.email ?? ''} />
          ) : (
            <RequestsView
              requests={visibleRequests}
              profilesById={profilesById}
              isLoading={isLoading}
              view={activeTab}
              onUpdated={() => void loadData()}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function DashboardOverview({
  requestCount,
  pendingCount,
  activeCount,
  resolvedCount,
  userCount,
  totalRequested,
  requests,
  isLoading,
  profilesById,
  onOpenClaims,
}: {
  requestCount: number
  pendingCount: number
  activeCount: number
  resolvedCount: number
  userCount: number
  totalRequested: number
  requests: CaseRequest[]
  isLoading: boolean
  profilesById: Map<string, AdminProfile>
  onOpenClaims: () => void
}) {
  const metrics = [
    { title: 'Total requests', value: requestCount, icon: ClipboardList, tone: 'violet' },
    { title: 'Pending triage', value: pendingCount, icon: FileText, tone: 'amber' },
    { title: 'Active review', value: activeCount, icon: FolderOpen, tone: 'slate' },
    { title: 'Resolved', value: resolvedCount, icon: CheckCircle2, tone: 'green' },
    { title: 'Registered users', value: userCount, icon: Users, tone: 'violet' },
  ]

  return (
    <>
      <section className="admin-metrics">
        {metrics.map(({ title, value, icon: Icon, tone }) => (
          <article className="admin-metric-card" key={title}>
            <div className="admin-metric-top"><span>{title}</span><span className={`admin-metric-icon ${tone}`}><Icon size={17} /></span></div>
            <strong>{isLoading ? '…' : value}</strong>
          </article>
        ))}
        <article className="admin-metric-card">
          <div className="admin-metric-top"><span>Amount requested</span><span className="admin-metric-icon slate"><Banknote size={17} /></span></div>
          <strong>{isLoading ? '…' : formatCurrency(totalRequested, 'USD')}</strong>
          <small>USD requests only; not balances or funds held.</small>
        </article>
      </section>
      <section className="admin-overview-grid">
        <div className="dashboard-panel admin-queue-panel">
          <div className="dashboard-panel-heading"><div><h2>Queue by status</h2><p>Current request review stages</p></div></div>
          <StatusQueue items={statusOptions.map((status) => ({ status, count: requests.filter((request) => request.status === status).length }))} />
        </div>
        <div className="dashboard-panel admin-latest-panel">
          <div className="dashboard-panel-heading">
            <div><h2>Latest submissions</h2><p>Most recent member requests</p></div>
            <button type="button" onClick={onOpenClaims}>All claims <ArrowRight size={14} /></button>
          </div>
          {isLoading ? <p className="admin-empty">Loading requests…</p> : requests.length === 0 ? <p className="admin-empty">No requests have been submitted.</p> : (
            <div className="admin-latest-list">
              {requests.slice(0, 5).map((request) => (
                <div className="admin-latest-item" key={request.id}>
                  <div><strong>{requestTypeLabels[request.request_type]} · {request.id.slice(0, 8).toUpperCase()}</strong><small>{request.subject} · {profilesById.get(request.user_id)?.email ?? 'Member'}</small></div>
                  <span className={`case-status status-${request.status.replace('_', '-')}`}>{requestStatusLabels[request.status]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function StatusQueue({ items }: { items: { status: CaseRequestStatus; count: number }[] }) {
  const maximum = Math.max(1, ...items.map(({ count }) => count))
  return (
    <div className="admin-status-queue">
      {items.map(({ status, count }) => (
        <div className="admin-status-row" key={status}>
          <div><span>{requestStatusLabels[status]}</span><strong>{count}</strong></div>
          <span className="admin-status-track"><span style={{ width: `${(count / maximum) * 100}%` }} /></span>
        </div>
      ))}
    </div>
  )
}

function RequestsView({
  requests,
  profilesById,
  isLoading,
  view,
  onUpdated,
}: {
  requests: CaseRequest[]
  profilesById: Map<string, AdminProfile>
  isLoading: boolean
  view: AdminTab
  onUpdated: () => void
}) {
  if (isLoading) return <p className="admin-empty">Loading requests…</p>
  if (requests.length === 0) return <p className="admin-empty admin-panel-empty">No {view.toLowerCase()} requests found.</p>
  return (
    <div className="admin-request-list">
      {requests.map((request) => (
        <RequestReviewCard key={request.id} request={request} email={profilesById.get(request.user_id)?.email ?? 'Member'} onUpdated={onUpdated} />
      ))}
    </div>
  )
}

function RequestReviewCard({ request, email, onUpdated }: { request: CaseRequest; email: string; onUpdated: () => void }) {
  const [status, setStatus] = useState(request.status)
  const [staffMessage, setStaffMessage] = useState(request.staff_message ?? '')
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const amount = request.requested_amount && request.currency && isCurrency(request.currency)
    ? formatCurrency(request.requested_amount, request.currency)
    : null

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setIsSaving(true)
    try {
      const { error } = await getSupabase()
        .from('case_requests')
        .update({ status, staff_message: staffMessage.trim() || null })
        .eq('id', request.id)
      if (error) throw error
      setNotice('Review update saved.')
      onUpdated()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to save the review update.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <article className="admin-request-card">
      <div className="admin-request-heading">
        <div>
          <span className="admin-request-kind">{requestTypeLabels[request.request_type]} · {request.id.slice(0, 8).toUpperCase()}</span>
          <h2>{request.subject}</h2>
          <p>{email} · {new Date(request.created_at).toLocaleString()}</p>
        </div>
        <span className={`case-status status-${request.status.replace('_', '-')}`}>{requestStatusLabels[request.status]}</span>
      </div>
      <p className="admin-request-details">{request.details}</p>
      <div className="admin-request-meta">
        {amount && <span>Requested amount: <strong>{amount}</strong> (review only)</span>}
        {request.loan_term_months && <span>Preferred term: {request.loan_term_months} months</span>}
        {request.transaction_reference && <span>Reference: {request.transaction_reference}</span>}
        {request.closed_at && <span>Closed: {new Date(request.closed_at).toLocaleDateString()}</span>}
      </div>
      <form className="admin-review-form" onSubmit={handleUpdate}>
        <label>Status
          <select value={status} onChange={(event) => {
            const nextStatus = statusOptions.find((option) => option === event.currentTarget.value)
            if (nextStatus) setStatus(nextStatus)
          }}>
            {statusOptions.map((option) => <option value={option} key={option}>{requestStatusLabels[option]}</option>)}
          </select>
        </label>
        <label>Staff update for the member
          <textarea value={staffMessage} onChange={(event) => setStaffMessage(event.currentTarget.value)} maxLength={2000} rows={2} placeholder="Optional update or information request" />
        </label>
        <button className="dashboard-primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save review update'}</button>
        {notice && <p className="admin-inline-notice" role="status">{notice}</p>}
      </form>
    </article>
  )
}

function UsersView({ profiles, isLoading }: { profiles: AdminProfile[]; isLoading: boolean }) {
  return (
    <section className="dashboard-panel admin-data-panel">
      <div className="dashboard-panel-heading"><div><h2>Registered users</h2><p>Only profile details needed to identify the submitting member are shown.</p></div></div>
      {isLoading ? <p className="admin-empty">Loading users…</p> : profiles.length === 0 ? <p className="admin-empty">No registered users found.</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Country</th><th>Joined</th></tr></thead>
            <tbody>{profiles.map((profile) => (
              <tr key={profile.id}>
                <td>{[profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ') || '—'}</td>
                <td>{profile.email}</td>
                <td>{profile.country || '—'}</td>
                <td>{new Date(profile.created_at).toLocaleDateString()}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function DocumentsView({
  documents,
  profilesById,
  requests,
  isLoading,
  signedUrls,
  error,
  onOpen,
}: {
  documents: CaseDocument[]
  profilesById: Map<string, AdminProfile>
  requests: CaseRequest[]
  isLoading: boolean
  signedUrls: Record<string, string>
  error: string
  onOpen: (document: CaseDocument) => void
}) {
  const requestsById = new Map(requests.map((request) => [request.id, request]))
  return (
    <section className="dashboard-panel admin-data-panel">
      <div className="dashboard-panel-heading"><div><h2>Private documents</h2><p>Access is checked by Supabase row-level policies; generated links expire after 60 seconds.</p></div></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {isLoading ? <p className="admin-empty">Loading documents…</p> : documents.length === 0 ? <p className="admin-empty">No documents have been uploaded.</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>File</th><th>Request</th><th>User</th><th>Uploaded</th><th>Access</th></tr></thead>
            <tbody>{documents.map((document) => (
              <tr key={document.id}>
                <td>{document.file_name}<small className="admin-file-meta">{document.mime_type} · {(document.file_size / 1024 / 1024).toFixed(1)} MB</small></td>
                <td>{requestsById.get(document.request_id)?.subject ?? document.request_id.slice(0, 8)}</td>
                <td>{profilesById.get(document.user_id)?.email ?? 'Member'}</td>
                <td>{new Date(document.created_at).toLocaleDateString()}</td>
                <td>
                  {signedUrls[document.id]
                    ? <><a href={signedUrls[document.id]} target="_blank" rel="noreferrer">Open secure link</a><button className="admin-link-button" type="button" onClick={() => onOpen(document)}>Renew link</button></>
                    : <button className="admin-link-button" type="button" onClick={() => onOpen(document)}>Create 60-second link</button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function AdminSettings({ email }: { email: string }) {
  return (
    <section className="dashboard-panel admin-data-panel admin-settings-panel">
      <div className="dashboard-panel-heading"><div><h2>Administrator access</h2><p>Dashboard access is authorized by trusted Supabase app metadata and row-level security.</p></div></div>
      <div className="admin-setting-row"><span>Signed-in administrator</span><strong>{email}</strong></div>
      <div className="admin-setting-row"><span>Account password</span><p>Passwords are managed by Supabase Auth and are never shown in this dashboard.</p></div>
      <div className="admin-setting-row"><span>Document retention</span><p>Private files are purged 30 days after a request is marked resolved or declined by the scheduled cleanup task.</p></div>
      <div className="admin-setting-row"><span>Financial actions</span><p>Review statuses are administrative notes only. This dashboard does not transfer funds, approve lending, or change balances.</p></div>
    </section>
  )
}
