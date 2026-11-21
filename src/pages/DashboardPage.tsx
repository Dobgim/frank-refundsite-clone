import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  Banknote,
  Bell,
  CheckCircle,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  CreditCard,
  FilePlus2,
  FileText,
  FolderOpen,
  Headset,
  Hourglass,
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
import { Link, useSearchParams } from 'react-router-dom'
import { currencyOptions, formatCurrency, isCurrency, type Currency } from '../currency'
import '../dashboard.css'

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

const quickActions: { label: string; icon: LucideIcon; tab: DashboardTab }[] = [
  { label: 'Send money', icon: Send, tab: 'Fund Transfer' },
  { label: 'Withdraw', icon: Banknote, tab: 'Withdraw' },
  { label: 'Transactions', icon: CreditCard, tab: 'Transactions' },
  { label: 'Pay a bill', icon: ReceiptText, tab: 'Pay Bill' },
  { label: 'Savings (DPS)', icon: PiggyBank, tab: 'DPS' },
  { label: 'Fixed deposit', icon: Landmark, tab: 'FDR' },
]

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedCurrency = searchParams.get('currency')
  const currency = isCurrency(requestedCurrency) ? requestedCurrency : 'USD'

  useEffect(() => {
    document.title = `${activeTab} - Whitehill Demo Dashboard`
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
            <span className="dashboard-avatar">JD</span>
            <span className="dashboard-user-name"><strong>John Doe</strong><small>demo@example.com</small></span>
            <span className="dashboard-user-role">USER</span>
          </div>
          <Link className="dashboard-signout" to="/login"><LogOut size={15} /> Sign out</Link>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-mobile-bar">
          <button type="button" aria-label="Open dashboard menu" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
          <span>Whitehill <b>Bank</b></span>
          <Link to="/login" aria-label="Sign out"><LogOut size={18} /></Link>
        </div>
        <div className="dashboard-content">
          <header className="dashboard-page-header">
            <div>
              <p className="dashboard-demo-tag"><span /> DEMO ACCOUNT</p>
              <h1>{activeTab === 'Overview' ? 'Welcome back, John' : activeTab}</h1>
              <p className="dashboard-subtitle">
                {activeTab === 'Overview'
                  ? 'A snapshot of everything currently open on your account.'
                  : `Manage your ${activeTab.toLowerCase()} and see your latest account information.`}
              </p>
            </div>
            <button className="dashboard-primary-button" type="button" onClick={() => chooseTab('Loan')}>
              <Landmark size={16} /> View loan options
            </button>
          </header>

          <div className="dashboard-demo-notice">
            <ShieldAlert size={20} />
            <div><strong>Sample dashboard</strong><p>Demo data only. Claims, transfers, loans, and account actions are not submitted or processed.</p></div>
          </div>

          {activeTab === 'Overview' ? (
            <Overview onSelect={chooseTab} currency={currency} />
          ) : activeTab === 'My Claims' ? (
            <ClaimsPanel onStart={() => chooseTab('Start a Claim')} />
          ) : activeTab === 'Notifications' ? (
            <NotificationsPanel />
          ) : activeTab === 'Start a Claim' ? (
            <DemoActionPanel key={activeTab} title={activeTab} currency={currency} />
          ) : activeTab === 'Verification' ? (
            <VerificationPanel />
          ) : activeTab === 'Settings' ? (
            <SettingsPanel currency={currency} onCurrencyChange={chooseCurrency} />
          ) : activeTab === 'Fund Transfer' || activeTab === 'Withdraw' || activeTab === 'Pay Bill' || activeTab === 'DPS' || activeTab === 'FDR' ? (
            <DemoActionPanel key={activeTab} title={activeTab} currency={currency} />
          ) : activeTab === 'Loan' ? (
            <LoanPanel currency={currency} />
          ) : activeTab === 'Transactions' ? (
            <TransactionsPanel />
          ) : activeTab === 'Track a Case' ? (
            <CasesPanel onSupport={() => chooseTab('Contact Support')} />
          ) : activeTab === 'Help Center' ? (
            <HelpCenterPanel onContact={() => chooseTab('Contact Support')} />
          ) : (
            <ContactSupportPanel />
          )}
        </div>
      </main>
    </div>
  )
}

function Overview({ onSelect, currency }: { onSelect: (tab: DashboardTab) => void; currency: Currency }) {
  return (
    <>
      <section className="dashboard-overview-grid">
        <div className="dashboard-bank-card">
          <div className="bank-card-top"><span className="chip"><i /><i /><i /><i /></span><span className="bank-card-brand"><Landmark size={17} /> Whitehill</span></div>
          <div className="bank-card-caption">AVAILABLE BALANCE</div>
          <div className="bank-card-balance">{formatCurrency(0, currency)}</div>
          <div className="bank-card-number">WH 40&nbsp; 0010&nbsp; 0023</div>
          <div className="bank-card-bottom"><span>John Doe</span><small>DEMO ACCOUNT</small></div>
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
        <div><strong>Account status: <b>Demo</b></strong><span>demo@example.com · United Kingdom</span></div>
        <span className="member-date">Sample member · Oct 31, 2026</span>
      </section>

      <section className="dashboard-metrics">
        <MetricCard title="Active cases" value="0" note="In the pipeline right now" icon={FolderOpen} tone="violet" />
        <MetricCard title="Awaiting your input" value="0" note="Documents requested" icon={Hourglass} tone="amber" />
        <MetricCard title="Completed" value="0" note="Resolved or closed" icon={CircleCheck} tone="green" />
        <MetricCard title="Recovered" value={formatCurrency(0, currency)} note="Across resolved cases" icon={ClipboardList} tone="slate" />
      </section>

      <section className="dashboard-lower-grid">
        <div className="dashboard-panel">
          <div className="dashboard-panel-heading"><div><h2>Recent activity</h2><p>Your latest account updates</p></div><button type="button" onClick={() => onSelect('Transactions')}>View all <ArrowRight size={14} /></button></div>
          <div className="dashboard-empty-state"><span><FileText size={20} /></span><strong>No recent activity</strong><p>New updates will appear here in your demo dashboard.</p></div>
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

function ClaimsPanel({ onStart }: { onStart: () => void }) {
  return (
    <section className="dashboard-panel dashboard-page-panel">
      <div className="dashboard-panel-heading">
        <div><h2>My claims</h2><p>Track claim requests and their latest updates.</p></div>
        <button className="dashboard-primary-button" type="button" onClick={onStart}><FilePlus2 size={15} /> Start a claim</button>
      </div>
      <div className="dashboard-empty-state spacious">
        <span><FolderOpen size={22} /></span>
        <strong>No demo claims yet</strong>
        <p>Start a sample request to see how the claim flow is organized.</p>
        <button className="dashboard-outline-button" type="button" onClick={onStart}>Create sample claim</button>
      </div>
    </section>
  )
}

function NotificationsPanel() {
  return (
    <section className="dashboard-panel dashboard-page-panel">
      <div className="dashboard-panel-heading"><div><h2>Notifications</h2><p>Messages about this sample account.</p></div></div>
      <div className="dashboard-notice-item">
        <span><Bell size={17} /></span>
        <div><strong>Welcome to your sample dashboard</strong><p>This dashboard uses example information only. No account data is connected.</p></div>
      </div>
      <div className="dashboard-notice-item">
        <span><ShieldAlert size={17} /></span>
        <div><strong>Verification center</strong><p>Identity verification is not available in this local demo.</p></div>
      </div>
    </section>
  )
}

function VerificationPanel() {
  return (
    <section className="dashboard-panel dashboard-page-panel">
      <div className="dashboard-panel-heading"><div><h2>Verification center</h2><p>Review the sample status of your account profile.</p></div></div>
      <div className="dashboard-verification-card">
        <ShieldAlert size={20} />
        <div><strong>Verification is not connected</strong><p>This local preview does not collect identity documents or verify accounts.</p></div>
      </div>
      <div className="dashboard-verification-row"><CheckCircle size={18} /><div><strong>Email address</strong><p>Example only · Not verified</p></div><small>Demo</small></div>
      <div className="dashboard-verification-row"><ShieldCheck size={18} /><div><strong>Identity documents</strong><p>File uploads are disabled in this preview.</p></div><small>Not started</small></div>
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

function CasesPanel({ onSupport }: { onSupport: () => void }) {
  return (
    <section className="dashboard-panel dashboard-page-panel">
      <div className="dashboard-panel-heading"><div><h2>Track a case</h2><p>Review the latest status of your case requests.</p></div></div>
      <div className="dashboard-empty-state spacious"><span><FolderOpen size={22} /></span><strong>No demo cases yet</strong><p>Case tracking is not connected in this preview.</p><button className="dashboard-outline-button" type="button" onClick={onSupport}>Contact support</button></div>
    </section>
  )
}

function LoanPanel({ currency }: { currency: Currency }) {
  const [notice, setNotice] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('Demo only — your loan inquiry was not sent or saved.')
  }

  return (
    <section className="dashboard-panel dashboard-page-panel">
      <div className="dashboard-panel-heading"><div><h2>Loan inquiry</h2><p>Preview the request form. No loan is approved or processed.</p></div></div>
      <form className="dashboard-request-form" onSubmit={handleSubmit}>
        <label>Loan type<select defaultValue="" required><option value="" disabled>Select an option</option><option>Personal loan inquiry</option><option>Business loan inquiry</option></select></label>
        <div className="dashboard-form-row">
          <label>Requested amount ({currency})<input inputMode="decimal" placeholder="0.00" required /></label>
          <label>Preferred term<select defaultValue="" required><option value="" disabled>Select a term</option><option>12 months</option><option>24 months</option><option>36 months</option></select></label>
        </div>
        <label>Purpose<textarea rows={4} placeholder="Briefly describe your inquiry" required /></label>
        <button className="dashboard-primary-button" type="submit">Preview loan inquiry <ArrowRight size={15} /></button>
        {notice && <p className="dashboard-form-notice" role="status">{notice}</p>}
      </form>
    </section>
  )
}

function HelpCenterPanel({ onContact }: { onContact: () => void }) {
  return (
    <section className="dashboard-panel dashboard-page-panel">
      <div className="dashboard-panel-heading"><div><h2>Help center</h2><p>Quick answers for your sample account.</p></div></div>
      <div className="dashboard-help-topics">
        <article><strong>How do I track a case?</strong><p>Choose “Track a Case” to view updates. Case data is not connected in this demo.</p></article>
        <article><strong>Can I submit a loan request?</strong><p>The form is a visual preview only. Nothing is sent, saved, or approved.</p></article>
        <article><strong>Where can I see account activity?</strong><p>Open “Transactions” to review the sample activity state.</p></article>
      </div>
      <button className="dashboard-outline-button" type="button" onClick={onContact}>Contact support</button>
    </section>
  )
}

function ContactSupportPanel() {
  return (
    <section className="dashboard-panel dashboard-page-panel">
      <div className="dashboard-panel-heading"><div><h2>Contact support</h2><p>Choose the support option that works for you.</p></div></div>
      <div className="dashboard-support-card">
        <span><Headset size={20} /></span>
        <div><strong>Whitehill customer support</strong><p>Our team can help with questions about cases, transactions, and loan inquiries.</p></div>
      </div>
      <Link className="dashboard-primary-button dashboard-support-link" to="/contact/">Go to contact page <ArrowRight size={15} /></Link>
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
