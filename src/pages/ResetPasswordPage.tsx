import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../auth/useAuth'

export function ResetPasswordPage() {
  const { isConfigured, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setIsSubmitting(true)
    const password = new FormData(event.currentTarget).get('password')
    if (typeof password !== 'string') return

    try {
      await updatePassword(password)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to update your password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout pageTitle="Reset Password">
      <div className="auth-card login-card">
        <div className="login-card-heading">
          <h2>Choose a new password</h2>
          <p>Set a new password for your Whitehill Settlement account.</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="auth-field">New Password
            <input name="password" type="password" autoComplete="new-password" minLength={8} required />
          </label>
          <button className="auth-next-button login-submit" type="submit" disabled={!isConfigured || isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Update Password'}
          </button>
          {!isConfigured && <div className="auth-notice" role="alert">Supabase is not configured.</div>}
          {notice && <div className="auth-notice" role="alert">{notice}</div>}
        </form>
      </div>
    </AuthLayout>
  )
}
