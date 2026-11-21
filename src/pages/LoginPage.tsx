import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../auth/useAuth'

export function LoginPage() {
  const { isConfigured, signIn, requestPasswordReset } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget)
    try {
      await signIn(String(formData.get('email')), String(formData.get('password')))
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to sign in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function sendPasswordReset() {
    setNotice('')
    if (!email) {
      setNotice('Enter your email address above to receive a password reset link.')
      return
    }
    try {
      await requestPasswordReset(email)
      setNotice('If an account exists for this address, a password reset link has been sent.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to request a password reset.')
    }
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
              <input name="email" type="email" autoComplete="username" placeholder="Enter your email address" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required />
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
            <button className="forgot-link" type="button" onClick={() => void sendPasswordReset()}>Forgot password?</button>
          </div>
          <button className="auth-next-button login-submit" type="submit" disabled={!isConfigured || isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign In'} <span aria-hidden="true">→</span></button>
          {!isConfigured && <div className="auth-notice" role="alert">Supabase is not configured. Set the required environment variables to enable sign-in.</div>}
          {notice && <div className="auth-notice" role="status">{notice}</div>}
        </form>
        <div className="auth-card-footer">
          Don’t have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </AuthLayout>
  )
}
