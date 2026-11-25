import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  Banknote,
  Bell,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  CreditCard,
  FilePlus2,
  FolderOpen,
  Headset,
  Hourglass,
  Lock,
  Landmark,
  LifeBuoy,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Radar,
  ReceiptText,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { currencyOptions, formatCurrency, isCurrency, type Currency } from '../currency'
import { useAuth } from '../auth/useAuth'
import { CaseRequestForm } from '../components/CaseRequestForm'
import { IdentityVerificationPanel } from '../components/IdentityVerificationPanel'
import { getSupabase } from '../lib/supabase'
import type { Database, ProfileVerificationStatus } from '../lib/database.types'
import { requestStatusLabels, requestTypeLabels, verificationStatusClass, verificationStatusLabels } from '../lib/cases'
import '../dashboard.css'

type CaseRequest = Database['public']['Tables']['case_requests']['Row']
type IdentityVerification = Database['public']['Tables']['identity_verifications']['Row']

type DashboardTab =
  | 'Overview'
  | 'My Claims'
  | 'Notifications'
  | 'Start a Claim'
  | 'Verification'
  | 'Settings'
  | 'Fund Transfer'
  | 'Withdraw'
  | 'Pay Bill'
  | 'DPS'
  | 'FDR'
  | 'Loan'
  | 'Transactions'
  | 'Track a Case'
  | 'Help Center'
  | 'Contact Support'

const navigation: { label: DashboardTab; icon: LucideIcon }[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'My Claims', icon: ClipboardList },
  { label: 'Notifications', icon: Bell },
  { label: 'Start a Claim', icon: FilePlus2 },
  { label: 'Verification', icon: ShieldCheck },
  { label: 'Settings', icon: Settings },
  { label: 'Fund Transfer', icon: Send },
  { label: 'Withdraw', icon: Banknote },
  { label: 'Pay Bill', icon: ReceiptText },
  { label: 'DPS', icon: PiggyBank },
  { label: 'FDR', icon: Landmark },
  { label: 'Loan', icon: Landmark },
  { label: 'Transactions', icon: ReceiptText },
  { label: 'Track a Case', icon: Radar },
  { label: 'Help Center', icon: LifeBuoy },
  { label: 'Contact Support', icon: Headset },
]

/** Tabs that submit requests and therefore require an approved identity verification. */
const verificationRequiredTabs = new Set<DashboardTab>(['Start a Claim', 'Fund Transfer', 'Withdraw', 'Pay Bill', 'DPS', 'FDR', 'Loan'])

const quickActions: { label: string; icon: LucideIcon; tab: DashboardTab }[] = [
  { label: 'Send money', icon: Send, tab: 'Fund Transfer' },
  { label: 'Withdraw', icon: Banknote, tab: 'Withdraw' },
  { label: 'Transactions', icon: CreditCard, tab: 'Transactions' },
  { label: 'Pay a bill', icon: ReceiptText, tab: 'Pay Bill' },
  { label: 'Savings (DPS)', icon: PiggyBank, tab: 'DPS' },
  { label: 'Fixed deposit', icon: Landmark, tab: 'FDR' },
]

export function DashboardPage() {
  const { isAdmin, session, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<DashboardTab>('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const [caseRequests, setCaseRequests] = useState<CaseRequest[]>([])
  const [caseError, setCaseError] = useState('')
  const [isLoadingCases, setIsLoadingCases] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState<ProfileVerificationStatus>('unverified')
  const [latestVerification, setLatestVerification] = useState<IdentityVerification | null>(null)
  const [isLoadingVerification, setIsLoadingVerification] = useState(true)
  const [verificationError, setVerificationError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedCurrency = searchParams.get('currency')
  const currency = isCurrency(requestedCurrency) ? requestedCurrency : 'USD'
  const email = session?.user.email ?? ''
  const firstName = String(session?.user.user_metadata.first_name ?? email.split('@')[0] ?? 'Member')
  const fullName = [firstName, session?.user.user_metadata.last_name].filter(Boolean).join(' ')
  const initials = fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const country = String(session?.user.user_metadata.country ?? '—')
  const userId = session?.user.id

  const loadCaseRequests = useCallback(async () => {
    if (!userId) {
      setCaseRequests([])
      setIsLoadingCases(false)
      return
    }

    setIsLoadingCases(true)
    try {
      const { data, error } = await getSupabase()
        .from('case_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setCaseRequests(data)
      setCaseError('')
    } catch (error) {
      setCaseError(error instanceof Error ? error.message : 'Unable to load your requests.')
    } finally {
      setIsLoadingCases(false)
    }
  }, [userId])

  useEffect(() => {
    void loadCaseRequests()
  }, [loadCaseRequests])

  const loadVerification = useCallback(async () => {
    if (!userId) {
      setIsLoadingVerification(false)
      return
    }
    setIsLoadingVerification(true)
    try {
      const client = getSupabase()
      const [profileResult, verificationResult] = await Promise.all([
        client.from('profiles').select('verification_status').eq('id', userId).maybeSingle(),
        client.from('identity_verifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (profileResult.error) throw profileResult.error
      if (verificationResult.error) throw verificationResult.error
      setVerificationStatus(profileResult.data?.verification_status ?? 'unverified')
      setLatestVerification(verificationResult.data)
      setVerificationError('')
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : 'Unable to load your verification status.')
    } finally {
      setIsLoadingVerification(false)
    }
  }, [userId])

  useEffect(() => {
    void loadVerification()
  }, [loadVerification])

  const isVerified = verificationStatus === 'approved'
  const isLocked = verificationRequiredTabs.has(activeTab) && !isVerified

  useEffect(() => {
    document.title = `${activeTab} - Whitehill Dashboard`
    window.scrollTo(0, 0)
  }, [activeTab])

  function chooseTab(tab: DashboardTab) {
    setActiveTab(tab)
    setSidebarOpen(false)
  }

  function chooseCurrency(nextCurrency: Currency) {
    setSearchParams((currentParams) => {
      currentParams.set('currency', nextCurrency)
      return currentParams
    }, { replace: true })
  }

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Unable to sign out.')
    }
  }

  return (
    <div className="dashboard-shell">
      {sidebarOpen && <button className="dashboard-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Link className="dashboard-brand" to="/" aria-label="Whitehill Bank home">
          <span className="dashboard-brand-mark"><Landmark size={21} /></span>
          <span>Whitehill<span className="brand-accent">Bank</span></span>
        </Link>
        <div className="dashboard-portal-label">DASHBOARD MENU</div>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              className={`dashboard-nav-link ${activeTab === label ? 'nav-active' : ''}`}
              key={label}
              onClick={() => chooseTab(label)}
              type="button"
            >
              <Icon size={17} />
              <span>{label}</span>
              {activeTab === label && <ChevronRight className="nav-chevron" size={15} />}
            </button>
          ))}
        </nav>
        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-user-card">
            <span className="dashboard-avatar">{initials || 'U'}</span>
            <span className="dashboard-user-name"><strong>{fullName}</strong><small>{email}</small></span>
            <span className="dashboard-user-role">{isAdmin ? 'ADMIN' : 'USER'}</span>
          </div>
          {isAdmin && <Link className="dashboard-signout" to="/admin"><ShieldCheck size={15} /> Admin dashboard</Link>}
          <button className="dashboard-signout" type="button" onClick={() => void handleSignOut()}><LogOut size={15} /> Sign out</button>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-mobile-bar">
          <button type="button" aria-label="Open dashboard menu" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
          <span>Whitehill <b>Bank</b></span>
          <button type="button" aria-label="Sign out" onClick={() => void handleSignOut()}><LogOut size={18} /></button>
        </div>
        <div className="dashboard-content">
          <header className="dashboard-page-header">
            <div>
              <p className="dashboard-demo-tag"><span /> MEMBER ACCOUNT</p>
              <h1>{activeTab === 'Overview' ? `Welcome back, ${firstName}` : activeTab}</h1>
              <p className="dashboard-subtitle">
                {activeTab === 'Overview'
                  ? 'Your account dashboard and membership information.'
                  : `Manage your ${activeTab.toLowerCase()} and see your latest account information.`}
              </p>
            </div>
            <button className="dashboard-primary-button" type="button" onClick={() => chooseTab('Loan')}>
              <Landmark size={16} /> View loan options
            </button>
          </header>

          <div className="dashboard-demo-notice">
            <ShieldAlert size={20} />
            <div><strong>Requests are for review only</strong><p>Submitted requests and supporting documents are private and visible to you and authorized administrators. No loan, withdrawal, transfer, or balance change is executed by this site.</p></div>
          </div>
          {signOutError && <p className="dashboard-form-notice" role="alert">{signOutError}</p>}

          {!isLoadingVerification && !isVerified && activeTab !== 'Verification' && (
            <VerificationBanner status={verificationStatus} onVerify={() => chooseTab('Verification')} />
          )}

          {isLocked ? (
            <VerificationRequiredPanel title={activeTab} status={verificationStatus} isLoading={isLoadingVerification} onVerify={() => chooseTab('Verification')} />
          ) : activeTab === 'Overview' ? (
            <Overview onSelect={chooseTab} verificationStatus={isLoadingVerification ? null : verificationStatus} currency={currency} name={fullName} email={email} country={country} createdAt={session?.user.created_at ?? ''} requests={caseRequests} isLoading={isLoadingCases} requestError={caseError} />
          ) : activeTab === 'My Claims' ? (
            <ClaimsPanel onStart={() => chooseTab('Start a Claim')} requests={caseRequests.filter((request) => request.request_type === 'claim')} isLoading={isLoadingCases} error={caseError} />
          ) : activeTab === 'Notifications' ? (
            <NotificationsPanel />
          ) : activeTab === 'Start a Claim' ? (
            <CaseRequestForm key={activeTab} requestType="claim" userId={userId ?? ''} currency={currency} onSubmitted={loadCaseRequests} />
          ) : activeTab === 'Verification' ? (
            <IdentityVerificationPanel userId={userId ?? ''} status={verificationStatus} latest={latestVerification} isLoading={isLoadingVerification} loadError={verificationError} onSubmitted={loadVerification} />
          ) : activeTab === 'Settings' ? (
            <SettingsPanel currency={currency} onCurrencyChange={chooseCurrency} />
          ) : activeTab === 'Withdraw' ? (
            <CaseRequestForm key={activeTab} requestType="withdrawal" userId={userId ?? ''} currency={currency} onSubmitted={loadCaseRequests} />
          ) : activeTab === 'Fund Transfer' || activeTab === 'Pay Bill' || activeTab === 'DPS' || activeTab === 'FDR' ? (
            <DemoActionPanel key={activeTab} title={activeTab} currency={currency} />
          ) : activeTab === 'Loan' ? (
            <CaseRequestForm key={activeTab} requestType="loan" userId={userId ?? ''} currency={currency} onSubmitted={loadCaseRequests} />
          ) : activeTab === 'Transactions' ? (
            <TransactionsPanel />
          ) : activeTab === 'Track a Case' ? (
            <CasesPanel onSupport={() => chooseTab('Contact Support')} requests={caseRequests} isLoading={isLoadingCases} error={caseError} />
          ) : activeTab === 'Help Center' ? (
            <HelpCenterPanel onContact={() => chooseTab('Contact Support')} />
          ) : (
            <CaseRequestForm key={activeTab} requestType="support" userId={userId ?? ''} currency={currency} onSubmitted={loadCaseRequests} />
          )}
        </div>
      </main>
    </div>
  )
}

function Overview({
  onSelect,
  verificationStatus,
  currency,
  name,
  email,
  country,
  createdAt,
  requests,
  isLoading,
  requestError,
}: {
  onSelect: (tab: DashboardTab) => void
  verificationStatus: ProfileVerificationStatus | null
  currency: Currency
  name: string
  email: string
  country: string
  createdAt: string
  requests: CaseRequest[]
  isLoading: boolean
  requestError: string
}) {
  const activeRequests = requests.filter((request) => !['declined', 'resolved'].includes(request.status)).length
  const waitingForUser = requests.filter((request) => request.status === 'needs_information').length
  const resolvedRequests = requests.filter((request) => request.status === 'resolved' || request.status === 'declined').length

  return (
    <>
      <section className="dashboard-overview-grid">
        <div className="dashboard-bank-card">
          <div className="bank-card-top"><span className="chip"><i /><i /><i /><i /></span><span className="bank-card-brand"><Landmark size={17} /> Whitehill</span></div>
          <div className="bank-card-caption">AVAILABLE BALANCE</div>
          <div className="bank-card-balance">{formatCurrency(0, currency)}</div>
          <div className="bank-card-number">WH 40&nbsp; 0010&nbsp; 0023</div>
          <div className="bank-card-bottom"><span>{name}</span><small>DEMO ACCOUNT</small></div>
        </div>
        <div className="dashboard-quick-grid">
          {quickActions.map(({ label, icon: Icon, tab }) => (
            <button className="dashboard-quick-action" key={label} onClick={() => onSelect(tab)} type="button">
              <span><Icon size={17} /></span><strong>{label}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-account-status">
        <span className="status-icon"><ShieldCheck size={19} /></span>
        <div><strong>Account status: <b>Active</b></strong><span>{email} · {country}</span></div>
        {verificationStatus && (
          <button className={`case-status verification-pill ${verificationStatusClass[verificationStatus]}`} type="button" onClick={() => onSelect('Verification')}>
            Identity: {verificationStatusLabels[verificationStatus]}
          </button>
        )}
        <span className="member-date">Member since {createdAt ? new Date(createdAt).toLocaleDateString() : '—'}</span>
      </section>

      <section className="dashboard-metrics">
        <MetricCard title="Active requests" value={isLoading ? '…' : String(activeRequests)} note="Submitted for review" icon={FolderOpen} tone="violet" />
        <MetricCard title="Awaiting your input" value={isLoading ? '…' : String(waitingForUser)} note="More information requested" icon={Hourglass} tone="amber" />
        <MetricCard title="Completed" value={isLoading ? '…' : String(resolvedRequests)} note="Resolved or declined" icon={CircleCheck} tone="green" />
        <MetricCard title="Requests submitted" value={isLoading ? '…' : String(requests.length)} note={`Displayed in ${currency}`} icon={ClipboardList} tone="slate" />
      </section>

      <section className="dashboard-lower-grid">
        <div className="dashboard-panel">
          <div className="dashboard-panel-heading"><div><h2>Recent requests</h2><p>Your latest submissions and status</p></div><button type="button" onClick={() => onSelect('Track a Case')}>View all <ArrowRight size={14} /></button></div>
          <CaseRequestList requests={requests.slice(0, 3)} isLoading={isLoading} error={requestError} />
        </div>
        <div className="dashboard-panel">
          <div className="dashboard-panel-heading"><div><h2>Need a hand?</h2><p>We can help you understand what to do next.</p></div></div>
          <div className="dashboard-help-card"><span><Bell size={17} /></span><div><strong>Visit the support center</strong><p>Find answers or get in touch with our team.</p></div><Link to="/contact/" aria-label="Contact support"><ArrowRight size={16} /></Link></div>
          <button className="dashboard-text-action" type="button" onClick={() => onSelect('Track a Case')}>Track a case <ChevronRight size={15} /></button>
        </div>
      </section>
    </>
  )
}

function VerificationBanner({ status, onVerify }: { status: ProfileVerificationStatus; onVerify: () => void }) {
  const message = status === 'pending'
    ? 'Your identity documents are being reviewed. Claims and other requests unlock once an administrator approves them.'
    : status === 'rejected'
      ? 'Your identity verification was not approved. Please resubmit to unlock claims and other requests.'
      : 'Verify your identity with a government ID and a face photo to start claims and other requests.'
  return (
    <div className="verification-banner" role="status">
      <ShieldAlert size={18} />
      <p>{message}</p>
      {status !== 'pending' && <button className="dashboard-primary-button" type="button" onClick={onVerify}>Verify now <ArrowRight size={14} /></button>}
    </div>
  )
}

function VerificationRequiredPanel({
  title,
  status,
  isLoading,
  onVerify,
}: {
  title: string
  status: ProfileVerificationStatus
  isLoading: boolean
  onVerify: () => void
}) {
  if (isLoading) return <section className="dashboard-panel dashboard-page-panel"><p className="dashboard-muted-note">Checking your verification status…</p></section>
  return (
    <section className="dashboard-panel dashboard-page-panel">
      <div className="dashboard-empty-state spacious">
        <span><Lock size={22} /></span>
        <strong>Identity verification required</strong>
        <p>
          {status === 'pending'
            ? `Your documents are under review. ${title} will be available as soon as your identity is approved.`
            : `To use ${title}, first verify your identity with an ID card, passport, or driver's license and a live face photo.`}
        </p>
        {status !== 'pending' && <button className="dashboard-primary-button" type="button" onClick={onVerify}><ShieldCheck size={15} /> Verify my identity</button>}
      </div>
    </section>
  )
}

function MetricCard({
  title,
  value,
  note,
  icon: Icon,
  tone,
}: {
  title: string
  value: string
  note: string
  icon: LucideIcon
  tone: string
}) {
  return (
    <article className="dashboard-metric">
      <div className="metric-top"><span>{title}</span><span className={`metric-icon ${tone}`}><Icon size={16} /></span></div>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  )
}

function CaseRequestList({ requests, isLoading, error }: { requests: CaseRequest[]; isLoading: boolean; error: string }) {
  if (isLoading) return <p className="dashboard-muted-note">Loading your requests…</p>
  if (error) return <p className="dashboard-form-notice" role="alert">{error}</p>
  if (requests.length === 0) {
    return (
      <div className="dashboard-empty-state spacious">
        <span><FolderOpen size={22} /></span>
        <strong>No requests yet</strong>
        <p>Requests you submit for staff review will appear here.</p>
      </div>
    )
  }

  return (
    <div className="member-request-list">
      {requests.map((request) => {
        const amount = request.requested_amount && request.currency && isCurrency(request.currency)
          ? formatCurrency(request.requested_amount, request.currency)
          : ''
        return (
          <article className="member-request-item" key={request.id}>
            <div className="member-request-main">
              <span className="member-request-type">{requestTypeLabels[request.request_type]}</span>
              <strong>{request.subject}</strong>
              <p>{request.details}</p>
              {request.staff_message && <p className="member-staff-message"><b>Team update:</b> {request.staff_message}</p>}
              <small>Reference {request.id.slice(0, 8).toUpperCase()} · {new Date(request.created_at).toLocaleDateString()}</small>
            </div>
            <div className="member-request-meta">
              {amount && <strong>{amount}</strong>}
              <span className={`case-status status-${request.status.replace('_', '-')}`}>{requestStatusLabels[request.status]}</span>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function ClaimsPanel({ onStart, requests, isLoading, error }: { onStart: () => void; requests: CaseRequest[]; isLoading: boolean; error: string }) {
  return (
    <section className="dashboard-panel dashboard-page-panel">
      <div className="dashboard-panel-heading">
        <div><h2>My claims</h2><p>Track claim requests and their latest updates.</p></div>
        <button className="dashboard-primary-button" type="button" onClick={onStart}><FilePlus2 size={15} /> Start a claim</button>
      </div>
      <CaseRequestList requests={requests} isLoading={isLoading} error={error} />
    </section>
  )
}

function NotificationsPanel() {
  return (
    <section className="dashboard-panel dashboard-page-panel">
      <div className="dashboard-panel-heading"><div><h2>Notifications</h2><p>Messages about this sample account.</p></div></div>
      <div className="dashboard-notice-item">
        <span><Bell size={17} /></span>
        <div><strong>Welcome to your dashboard</strong><p>Requests you submit for review are available under Track a Case.</p></div>
      </div>
      <div className="dashboard-notice-item">
        <span><ShieldAlert size={17} /></span>
        <div><strong>Keep documents private</strong><p>Only upload the documents requested for your case. Never share passwords, PINs, or card security codes.</p></div>
      </div>
    </section>
  )
}

function SettingsPanel({
  currency,
  onCurrencyChange,
}: {
  currency: Currency
  onCurrencyChange: (currency: Currency) => void
}) {
  function handleCurrencyChange(value: string) {
    if (isCurrency(value)) onCurrencyChange(value)
  }

  return (
    <section className="dashboard-panel dashboard-page-panel">
      <div className="dashboard-panel-heading"><div><h2>Profile settings</h2><p>Sample profile details for the visual dashboard.</p></div></div>
      <div className="dashboard-profile-grid">
        <div><span>Full name</span><strong>John Doe</strong></div>
        <div><span>Email address</span><strong>demo@example.com</strong></div>
        <div><span>Country</span><strong>United Kingdom</strong></div>
        <div><span>Account type</span><strong>Personal account</strong></div>
        <label className="dashboard-currency-setting">
          <span>Preferred currency</span>
          <select value={currency} onChange={(event) => handleCurrencyChange(event.currentTarget.value)}>
            {currencyOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      <p className="dashboard-muted-note">Currency changes update the demo display only. No account data or real exchange rates are connected.</p>
    </section>
  )
}

function CasesPanel({ onSupport, requests, isLoading, error }: { onSupport: () => void; requests: CaseRequest[]; isLoading: boolean; error: string }) {
  return (
    <section className="dashboard-panel dashboard-page-panel">
      <div className="dashboard-panel-heading"><div><h2>Track a case</h2><p>Review the latest status of your case requests.</p></div></div>
      <CaseRequestList requests={requests} isLoading={isLoading} error={error} />
      {!isLoading && <button className="dashboard-outline-button" type="button" onClick={onSupport}>Contact customer service</button>}
    </section>
  )
}

function HelpCenterPanel({ onContact }: { onContact: () => void }) {
  return (
    <section className="dashboard-panel dashboard-page-panel">
      <div className="dashboard-panel-heading"><div><h2>Help center</h2><p>Quick answers for your sample account.</p></div></div>
      <div className="dashboard-help-topics">
        <article><strong>How do I track a case?</strong><p>Choose “Track a Case” to view requests and staff updates.</p></article>
        <article><strong>Can I submit a loan request?</strong><p>Loan inquiries are recorded for staff review only; they are not offers, approvals, or disbursements.</p></article>
        <article><strong>Where can I see account activity?</strong><p>Open “Transactions” to review the sample activity state.</p></article>
      </div>
      <button className="dashboard-outline-button" type="button" onClick={onContact}>Contact support</button>
    </section>
  )
}

function TransactionsPanel() {
  return (
    <section className="dashboard-panel dashboard-page-panel">
      <div className="dashboard-panel-heading"><div><h2>Transactions</h2><p>Example account activity.</p></div></div>
      <div className="dashboard-empty-state spacious"><span><ReceiptText size={22} /></span><strong>No demo transactions</strong><p>Transactions are not connected or processed in this dashboard preview.</p></div>
    </section>
  )
}

function DemoActionPanel({ title, currency }: { title: string; currency: Currency }) {
  const [notice, setNotice] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(`Demo only — your ${title.toLowerCase()} request was not sent or saved.`)
  }

  return (
    <section className="dashboard-panel dashboard-page-panel">
      <div className="dashboard-panel-heading"><div><h2>{title}</h2><p>Preview the request form. No financial action will be processed.</p></div></div>
      <form className="dashboard-request-form" onSubmit={handleSubmit}>
        <label>Request type
          <select defaultValue="" required>
            <option value="" disabled>Select an option</option>
            <option>{title}</option>
            <option>Account question</option>
          </select>
        </label>
        <div className="dashboard-form-row">
          <label>Reference or recipient<input placeholder="Example only" /></label>
          <label>Amount (optional)<input inputMode="decimal" placeholder={formatCurrency(0, currency)} /></label>
        </div>
        <label>Details<textarea rows={4} placeholder="Add a short description for this sample request" required /></label>
        <button className="dashboard-primary-button" type="submit">Preview request <ArrowRight size={15} /></button>
        {notice && <p className="dashboard-form-notice" role="status">{notice}</p>}
      </form>
    </section>
  )
}
