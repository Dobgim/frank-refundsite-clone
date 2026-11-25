import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { EmailOtpType } from '@supabase/supabase-js'
import { AuthLayout } from '../components/AuthLayout'
import { getSupabase } from '../lib/supabase'

const confirmTypes = new Set<EmailOtpType>(['signup', 'magiclink', 'email'])

/** Landing page for the confirmation link emailed by /api/auth-email. */
export function AuthConfirmPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [verifyError, setError] = useState('')
  const started = useRef(false)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const isValidLink = Boolean(tokenHash && type && confirmTypes.has(type))
  const error = isValidLink ? verifyError : 'This confirmation link is incomplete. Please use the latest link we emailed you.'

  useEffect(() => {
    if (started.current || !tokenHash || !type || !isValidLink) return
    started.current = true

    void getSupabase().auth.verifyOtp({ token_hash: tokenHash, type }).then(({ data, error: verifyError }) => {
      if (verifyError || !data.user) {
        setError('This confirmation link is invalid or has expired. Sign in to request a new one.')
        return
      }
      navigate(data.user.app_metadata.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    })
  }, [isValidLink, navigate, tokenHash, type])

  return (
    <AuthLayout pageTitle="Confirm Email">
      <div className="auth-card login-card">
        <div className="login-card-heading">
          <h2>{error ? 'Confirmation failed' : 'Confirming your email…'}</h2>
          <p>{error || 'Please wait while we activate your account.'}</p>
        </div>
        {error && <div className="auth-card-footer"><Link to="/login">Go to sign in</Link></div>}
      </div>
    </AuthLayout>
  )
}
