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
  Trash2,
  UserCheck,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { formatCurrency, isCurrency } from '../currency'
import { getSupabase } from '../lib/supabase'
import type { CaseRequestStatus, Database, VerificationStatus } from '../lib/database.types'
import { documentTypeLabels, requestStatusLabels, requestTypeLabels, verificationStatusClass, verificationStatusLabels } from '../lib/cases'
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
type AdminProfile = Pick<Profile, 'id' | 'email' | 'first_name' | 'middle_name' | 'last_name' | 'country' | 'created_at' | 'verification_status'>
type IdentityVerification = Database['public']['Tables']['identity_verifications']['Row']

const profileColumns = 'id, email, first_name, middle_name, last_name, country, created_at, verification_status'

function displayName(profile: AdminProfile | undefined) {
  if (!profile) return 'Member'
  return [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ') || profile.email
}

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
  Verifications: 'Review identity documents and face photos, then approve or reject each member.',
  Withdrawals: 'Review withdrawal requests. This dashboard does not move funds.',
  'Loan applications': 'Review loan inquiries. An approval here does not create or disburse a loan.',
  Users: 'View registered members, their verification status, and remove accounts.',
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
  const [verifications, setVerifications] = useState<IdentityVerification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [documentError, setDocumentError] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const client = getSupabase()
      const [requestResult, profileResult, documentResult, verificationResult] = await Promise.all([
        client.from('case_requests').select('*').order('created_at', { ascending: false }),
        client.from('profiles').select(profileColumns).order('created_at', { ascending: false }),
        client.from('case_documents').select('*').order('created_at', { ascending: false }),
        client.from('identity_verifications').select('*').order('created_at', { ascending: false }),
      ])
      if (requestResult.error) throw requestResult.error
      if (profileResult.error) throw profileResult.error
      if (documentResult.error) throw documentResult.error
      if (verificationResult.error) throw verificationResult.error
      setRequests(requestResult.data)
      setProfiles(profileResult.data)
      setDocuments(documentResult.data)
      setVerifications(verificationResult.data)
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
  const pendingVerificationCount = verifications.filter((verification) => verification.status === 'pending').length
  const resolvedCount = requests.filter((request) => request.status === 'declined' || request.status === 'resolved').length

  const visibleRequests = useMemo(() => {
    switch (activeTab) {
      case 'Claims': return requests.filter((request) => request.request_type === 'claim')
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
              pendingVerificationCount={pendingVerificationCount}
              totalRequested={totalRequestedUSD}
              requests={requests}
              isLoading={isLoading}
              profilesById={profilesById}
              onOpenClaims={() => setActiveTab('Claims')}
            />
          ) : activeTab === 'Verifications' ? (
            <VerificationsView verifications={verifications} profilesById={profilesById} isLoading={isLoading} onUpdated={() => void loadData()} />
          ) : activeTab === 'Users' ? (
            <UsersView profiles={profiles} isLoading={isLoading} currentUserId={session?.user.id ?? ''} onDeleted={() => void loadData()} />
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
  pendingVerificationCount,
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
  pendingVerificationCount: number
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
    { title: 'Pending verifications', value: pendingVerificationCount, icon: UserCheck, tone: 'amber' },
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

/** Removes every object under `prefix` (recursively) from a private storage bucket. */
async function removeStorageFolder(bucket: string, prefix: string): Promise<void> {
  const storage = getSupabase().storage.from(bucket)
  for (;;) {
    const { data: entries, error } = await storage.list(prefix, { limit: 100, offset: 0 })
    if (error) throw error
    const files = entries.filter((entry) => entry.id !== null).map((entry) => `${prefix}/${entry.name}`)
    for (const folder of entries.filter((entry) => entry.id === null)) {
      await removeStorageFolder(bucket, `${prefix}/${folder.name}`)
    }
    if (files.length === 0) return
    const { error: removeError } = await storage.remove(files)
    if (removeError) throw removeError
  }
}

function UsersView({
  profiles,
  isLoading,
  currentUserId,
  onDeleted,
}: {
  profiles: AdminProfile[]
  isLoading: boolean
  currentUserId: string
  onDeleted: () => void
}) {
  const [confirmingId, setConfirmingId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [notice, setNotice] = useState('')

  async function deleteUser(profile: AdminProfile) {
    setNotice('')
    setDeletingId(profile.id)
    try {
      const client = getSupabase()
      // Private files are not removed by the database cascade, so delete them first.
      for (const bucket of ['case-documents', 'identity-verifications']) {
        await removeStorageFolder(bucket, profile.id)
      }
      const { error } = await client.rpc('admin_delete_user', { target_user_id: profile.id })
      if (error) throw error
      setNotice(`${profile.email} was deleted along with their requests and private files.`)
      setConfirmingId('')
      onDeleted()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to delete this user.')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <section className="dashboard-panel admin-data-panel">
      <div className="dashboard-panel-heading"><div><h2>Registered users</h2><p>Deleting a user permanently removes their account, requests, verification records, and private files.</p></div></div>
      {notice && <p className="admin-inline-notice admin-users-notice" role="status">{notice}</p>}
      {isLoading ? <p className="admin-empty">Loading users…</p> : profiles.length === 0 ? <p className="admin-empty">No registered users found.</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Country</th><th>Identity</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>{profiles.map((profile) => (
              <tr key={profile.id}>
                <td>{[profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ') || '—'}</td>
                <td>{profile.email}</td>
                <td>{profile.country || '—'}</td>
                <td><span className={`case-status ${verificationStatusClass[profile.verification_status]}`}>{verificationStatusLabels[profile.verification_status]}</span></td>
                <td>{new Date(profile.created_at).toLocaleDateString()}</td>
                <td>
                  {profile.id === currentUserId ? <small className="admin-file-meta">You</small>
                    : confirmingId === profile.id ? (
                      <span className="admin-delete-confirm">
                        <button className="admin-danger-button" type="button" disabled={deletingId === profile.id} onClick={() => void deleteUser(profile)}>
                          {deletingId === profile.id ? 'Deleting…' : 'Confirm delete'}
                        </button>
                        <button className="admin-link-button" type="button" disabled={deletingId === profile.id} onClick={() => setConfirmingId('')}>Cancel</button>
                      </span>
                    ) : (
                      <button className="admin-link-button admin-delete-link" type="button" onClick={() => { setNotice(''); setConfirmingId(profile.id) }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  )
}

const verificationFilters: { value: VerificationStatus | 'all'; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
]

function VerificationsView({
  verifications,
  profilesById,
  isLoading,
  onUpdated,
}: {
  verifications: IdentityVerification[]
  profilesById: Map<string, AdminProfile>
  isLoading: boolean
  onUpdated: () => void
}) {
  const [filter, setFilter] = useState<VerificationStatus | 'all'>('pending')
  const visible = filter === 'all' ? verifications : verifications.filter((verification) => verification.status === filter)

  return (
    <>
      <div className="admin-filter-tabs" role="tablist" aria-label="Filter verifications">
        {verificationFilters.map(({ value, label }) => (
          <button key={value} type="button" role="tab" aria-selected={filter === value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>
            {label}
            <span>{value === 'all' ? verifications.length : verifications.filter((verification) => verification.status === value).length}</span>
          </button>
        ))}
      </div>
      {isLoading ? <p className="admin-empty">Loading verifications…</p> : visible.length === 0 ? (
        <p className="admin-empty admin-panel-empty">No {filter === 'all' ? '' : `${filter} `}identity verifications.</p>
      ) : (
        <div className="admin-request-list">
          {visible.map((verification) => (
            <VerificationReviewCard key={verification.id} verification={verification} profile={profilesById.get(verification.user_id)} onUpdated={onUpdated} />
          ))}
        </div>
      )}
    </>
  )
}

function VerificationReviewCard({
  verification,
  profile,
  onUpdated,
}: {
  verification: IdentityVerification
  profile: AdminProfile | undefined
  onUpdated: () => void
}) {
  const [note, setNote] = useState(verification.admin_note ?? '')
  const [notice, setNotice] = useState('')
  const [savingStatus, setSavingStatus] = useState<VerificationStatus | ''>('')
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [loadError, setLoadError] = useState('')

  const files = useMemo(() => [
    { key: 'front', label: verification.document_type === 'passport' ? 'Passport photo page' : 'Document front', path: verification.document_storage_path },
    ...(verification.document_back_storage_path ? [{ key: 'back', label: 'Document back', path: verification.document_back_storage_path }] : []),
    { key: 'selfie', label: 'Live face photo', path: verification.selfie_storage_path },
  ], [verification])

  useEffect(() => {
    let active = true
    void getSupabase()
      .storage
      .from('identity-verifications')
      .createSignedUrls(files.map(({ path }) => path), 300)
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setLoadError(error.message)
          return
        }
        const next: Record<string, string> = {}
        data.forEach((entry, index) => {
          if (entry.signedUrl) next[files[index].key] = entry.signedUrl
        })
        setUrls(next)
      })
    return () => { active = false }
  }, [files])

  async function review(status: VerificationStatus) {
    setNotice('')
    if (status === 'rejected' && !note.trim()) {
      setNotice('Add a note explaining why the verification was rejected so the member knows what to fix.')
      return
    }
    setSavingStatus(status)
    try {
      const { error } = await getSupabase()
        .from('identity_verifications')
        .update({ status, admin_note: note.trim() || null })
        .eq('id', verification.id)
      if (error) throw error
      onUpdated()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to save the review.')
    } finally {
      setSavingStatus('')
    }
  }

  return (
    <article className="admin-request-card">
      <div className="admin-request-heading">
        <div>
          <span className="admin-request-kind">Identity verification · {documentTypeLabels[verification.document_type]}</span>
          <h2>{displayName(profile)}</h2>
          <p>{profile?.email ?? 'Member'}{profile?.country ? ` · ${profile.country}` : ''} · Submitted {new Date(verification.created_at).toLocaleString()}</p>
        </div>
        <span className={`case-status ${verificationStatusClass[verification.status]}`}>{verificationStatusLabels[verification.status]}</span>
      </div>

      {loadError && <p className="admin-error" role="alert">{loadError}</p>}
      <div className="admin-verification-files">
        {files.map(({ key, label, path }) => {
          const url = urls[key]
          const isPdf = path.toLowerCase().endsWith('.pdf')
          return (
            <figure key={key} className={key === 'selfie' ? 'is-selfie' : ''}>
              <figcaption>{label}</figcaption>
              {!url ? <div className="admin-file-loading">Loading…</div>
                : isPdf ? <a className="admin-file-loading" href={url} target="_blank" rel="noreferrer"><FileText size={20} /> Open PDF</a>
                  : <a href={url} target="_blank" rel="noreferrer" title="Open full size"><img src={url} alt={`${label} for ${profile?.email ?? 'member'}`} /></a>}
            </figure>
          )
        })}
      </div>
      <p className="admin-file-meta">Compare the face photo with the photo on the document. Links expire after 5 minutes — refresh to renew.</p>

      {verification.reviewed_at && (
        <div className="admin-request-meta"><span>Reviewed: {new Date(verification.reviewed_at).toLocaleString()}</span></div>
      )}

      <div className="admin-review-form admin-verification-actions">
        <label>Note for the member {verification.status === 'pending' && <small>(required when rejecting)</small>}
          <textarea value={note} onChange={(event) => setNote(event.currentTarget.value)} maxLength={1000} rows={2} placeholder="e.g. The document photo is blurry — please upload a clearer image." />
        </label>
        <div className="admin-verification-buttons">
          {verification.status !== 'approved' && (
            <button className="dashboard-primary-button" type="button" disabled={savingStatus !== ''} onClick={() => void review('approved')}>
              <CheckCircle2 size={15} /> {savingStatus === 'approved' ? 'Approving…' : 'Approve'}
            </button>
          )}
          {verification.status !== 'rejected' && (
            <button className="admin-danger-button" type="button" disabled={savingStatus !== ''} onClick={() => void review('rejected')}>
              <XCircle size={15} /> {savingStatus === 'rejected' ? 'Rejecting…' : 'Reject'}
            </button>
          )}
        </div>
        {notice && <p className="admin-inline-notice" role="alert">{notice}</p>}
      </div>
    </article>
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
