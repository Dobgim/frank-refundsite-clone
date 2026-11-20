import { useEffect, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import '../auth.css'

const benefits = [
  ['Secure Banking Platform', 'Industry-leading security protocols to keep your funds safe'],
  ['Fast Transfers', 'Send and receive money quickly to anyone, anywhere'],
  ['24/7 Account Access', 'Manage your finances anytime, anywhere on any device'],
]

export function AuthLayout({
  children,
  pageTitle,
}: {
  children: ReactNode
  pageTitle: string
}) {
  useEffect(() => {
    document.title = `${pageTitle} - Whitehill Bank`
  }, [pageTitle])

  return (
    <div className="auth-page">
      <aside className="auth-brand-panel">
        <span className="auth-circle auth-circle-large" />
        <span className="auth-circle auth-circle-small" />
        <div className="auth-brand-content">
          <Link className="auth-logo" to="/" aria-label="Whitehill Bank home">
            <img
              src="/assets/Screenshot_2025-08-09_121543-removebg-preview.png"
              alt="Whitehill"
            />
          </Link>
          <h1>Start Banking with Us</h1>
          <p className="auth-brand-description">
            Create your Whitehill Settlement account in just a few steps and
            enjoy our full range of banking services.
          </p>
          <div className="auth-benefits">
            {benefits.map(([title, description]) => (
              <div className="auth-benefit" key={title}>
                <span className="auth-benefit-check"><Check size={14} /></span>
                <p><strong>{title}</strong> - {description}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
      <section className="auth-form-side">
        {children}
      </section>
    </div>
  )
}
