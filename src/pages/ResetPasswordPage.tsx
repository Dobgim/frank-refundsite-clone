import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../auth/useAuth'
import { getSupabase } from '../lib/supabase'

export function ResetPasswordPage() {
  const { isConfigured, session, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenHash = searchParams.get('token_hash')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(Boolean(tokenHash))
  const started = useRef(false)

  // The emailed reset link carries a one-time token; exchange it for a session first.
  useEffect(() => {
    if (!tokenHash || started.current) return
    started.current = true
    void getSupabase().auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ error }) => {
      if (error) setNotice('This reset link is invalid or has expired. Request a new one from the sign-in page.')
      setIsVerifying(false)
    })
  }, [tokenHash])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    const password = new FormData(event.currentTarget).get('password')
    if (typeof password !== 'string') return
    setIsSubmitting(true)

    try {
      await updatePassword(password)
      navigate(session?.user.app_metadata.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to update your password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = isConfigured && !isSubmitting && !isVerifying && Boolean(session)

  return (
    <AuthLayout pageTitle="Reset Password">
      <div className="auth-card login-card">
        <div className="login-card-heading">
          <h2>Choose a new password</h2>
          <p>{isVerifying ? 'Checking your reset link…' : 'Set a new password for your Whitehill Settlement account.'}</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="auth-field">New Password
            <input name="password" type="password" autoComplete="new-password" minLength={8} required />
          </label>
          <button className="auth-next-button login-submit" type="submit" disabled={!canSubmit}>
            {isSubmitting ? 'Saving…' : 'Update Password'}
          </button>
          {!isConfigured && <div className="auth-notice" role="alert">Supabase is not configured.</div>}
          {!isVerifying && !session && !notice && <div className="auth-notice" role="alert">Open the reset link from your email to set a new password.</div>}
          {notice && <div className="auth-notice" role="alert">{notice}</div>}
        </form>
        <div className="auth-card-footer"><Link to="/login">Back to sign in</Link></div>
      </div>
    </AuthLayout>
  )
}
