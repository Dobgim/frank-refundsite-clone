import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../auth/useAuth'

function isEmailNotConfirmed(error: unknown) {
  if (typeof error !== 'object' || error === null) return false
  const code = 'code' in error ? error.code : undefined
  const message = 'message' in error && typeof error.message === 'string' ? error.message : ''
  return code === 'email_not_confirmed' || /email not confirmed/i.test(message)
}

export function LoginPage() {
  const { isAdmin, isConfigured, session, signIn, requestPasswordReset, resendConfirmation } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [isResending, setIsResending] = useState(false)

  // Already signed in (e.g. returning visitor): go straight to the right dashboard.
  if (session && !isSubmitting) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setNeedsConfirmation(false)
    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget)
    try {
      const destination = await signIn(String(formData.get('email')), String(formData.get('password')))
      navigate(destination, { replace: true })
    } catch (error) {
      if (isEmailNotConfirmed(error)) {
        setNeedsConfirmation(true)
        setNotice('Your email address has not been confirmed yet. Click the link we emailed you, or send a new one below.')
      } else if (error instanceof Error && /invalid login credentials/i.test(error.message)) {
        setNotice('Incorrect email or password. Please try again, or use "Forgot password?" to reset it.')
      } else {
        setNotice(error instanceof Error ? error.message : 'Unable to sign in. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function resend() {
    setIsResending(true)
    try {
      await resendConfirmation(email)
      setNotice(`A new confirmation link was sent to ${email} from info@whitehillesettlement.online. Check your inbox and spam folder.`)
      setNeedsConfirmation(false)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to resend the confirmation email.')
    } finally {
      setIsResending(false)
    }
  }

  async function sendPasswordReset() {
    setNotice('')
    setNeedsConfirmation(false)
    if (!email) {
      setNotice('Enter your email address above to receive a password reset link.')
      return
    }
    try {
      await requestPasswordReset(email)
      setNotice('If an account exists for this address, a password reset link has been sent from info@whitehillesettlement.online.')
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
          {needsConfirmation && (
            <button className="forgot-link" type="button" disabled={isResending || !email} onClick={() => void resend()}>
              {isResending ? 'Sending…' : 'Resend confirmation email'}
            </button>
          )}
        </form>
        <div className="auth-card-footer">
          Don’t have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </AuthLayout>
  )
}
