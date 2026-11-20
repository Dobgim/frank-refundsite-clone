import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const [showDashboardLink, setShowDashboardLink] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('Sign-in preview only. Authentication is not connected, and no information was sent or saved.')
    setShowDashboardLink(true)
  }

  function showResetNotice() {
    setNotice('Password reset is not connected in this preview.')
    setShowDashboardLink(false)
  }

  return (
    <AuthLayout pageTitle="Sign In">
      <div className="auth-card login-card">
        <div className="login-card-heading">
          <span className="auth-step-icon"><ShieldCheck size={25} /></span>
          <h2>Welcome Back</h2>
          <p>Sign in to your Whitehill Settlement account</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="auth-field">Email Address
            <span className="auth-input-icon">
              <Mail size={17} />
              <input name="email" type="email" autoComplete="username" placeholder="Enter your email address" required />
            </span>
          </label>
          <label className="auth-field">Password
            <span className="auth-input-icon">
              <LockKeyhole size={17} />
              <input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" required />
              <button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          <div className="login-options">
            <label className="remember-me"><input type="checkbox" /> Remember me</label>
            <button className="forgot-link" type="button" onClick={showResetNotice}>Forgot password?</button>
          </div>
          <button className="auth-next-button login-submit" type="submit">Sign In <span aria-hidden="true">→</span></button>
          {notice && <div className="auth-notice" role="status"><p>{notice}</p>{showDashboardLink && <Link className="auth-demo-link" to="/dashboard">Open sample dashboard</Link>}</div>}
          <p className="auth-privacy-note">Your sign-in details stay in this preview and are not submitted.</p>
        </form>
        <div className="auth-card-footer">
          Don’t have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </AuthLayout>
  )
}
