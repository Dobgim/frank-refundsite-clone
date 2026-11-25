import { useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const navigation = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about/' },
  { label: 'Services', to: '/services/' },
  { label: 'Terms & Conditions', to: '/terms-and-condtitions/' },
  { label: 'Contact', to: '/contact/' },
]

const pageTitles: Record<string, string> = {
  '/': 'Home - Refund Settlement Bank',
  '/about/': 'About - Whitehill Bank',
  '/services/': 'Services - Whitehill Bank',
  '/terms-and-condtitions/': 'Terms & Conditions - Whitehill Bank',
  '/contact/': 'Contact - Whitehill Bank',
  '/register': 'Create Your Account - Whitehill Bank',
  '/login': 'Sign In - Whitehill Bank',
}

const portalUrl = '/login'
const accountUrl = '/register'
const copyrightYear = new Date().getFullYear()

export function SiteLayout({ children }: { children: ReactNode }) {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = pageTitles[location.pathname] ?? 'Whitehill Bank'
  }, [location.pathname])

  return (
    <div className="site-shell">
      <div className="announcement">
        <span className="announcement-dot" />
        Whitehill Bank is now available worldwide today.
      </div>
      <SiteHeader key={location.pathname} />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Whitehill Bank home" onClick={() => setMenuOpen(false)}>
          <img
            src="/assets/Screenshot_2025-08-09_121543-removebg-preview.png"
            alt="Whitehill"
          />
        </Link>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <Link className="mobile-login" to={portalUrl} onClick={() => setMenuOpen(false)}>
            Login <ArrowRight size={16} />
          </Link>
        </nav>
        <div className="header-actions">
          <Link className="login-link" to={portalUrl}>Login</Link>
          <Link className="button button-primary header-cta" to={accountUrl}>
            Get started <ArrowRight size={16} />
          </Link>
        </div>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-cta-wrap">
        <div className="footer-cta container-site">
          <div>
            <span className="eyebrow">A clearer way forward</span>
            <h2>Let’s get your refund journey started.</h2>
          </div>
          <Link className="button button-light" to={accountUrl}>
            Create an account <ArrowRight size={17} />
          </Link>
        </div>
      </div>
      <div className="footer-main container-site">
        <div className="footer-brand">
          <Link to="/" aria-label="Whitehill Bank home">
            <img
              src="/assets/Screenshot_2025-08-09_121543-removebg-preview.png"
              alt="Whitehill"
            />
          </Link>
          <p>
            A clear, secure, and dignified path to resolving refund claims and
            transaction disputes.
          </p>
        </div>
        <div className="footer-column">
          <h3>Explore</h3>
          {navigation.map((item) => (
            <Link key={item.to} to={item.to}>{item.label}</Link>
          ))}
        </div>
        <div className="footer-column">
          <h3>Get in touch</h3>
          <a href="mailto:info@whitehillesettlement.online">info@whitehillesettlement.online</a>
          <a href="tel:+6211144490">+62 111-444-90</a>
          <span>100 N Tryon St, Charlotte, NC 28202</span>
        </div>
        <div className="footer-column">
          <h3>Support</h3>
          <span>Every day, 07 am – 07 pm</span>
          <Link to={portalUrl}>Customer login <ArrowRight size={14} /></Link>
          <p>We’re here to help you find the right next step.</p>
        </div>
      </div>
      <div className="footer-bottom container-site">
        <span>© {copyrightYear} Whitehill Bank. All rights reserved.</span>
        <span>Built on trust. Guided by transparency.</span>
      </div>
    </footer>
  )
}

export { accountUrl }
