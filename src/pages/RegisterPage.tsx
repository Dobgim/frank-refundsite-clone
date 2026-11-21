import { useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ContactRound,
  Landmark,
  LockKeyhole,
  UserRound,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { currencyOptions, isCurrency, type Currency } from '../currency'
import { useAuth } from '../auth/useAuth'

const steps = ['Personal Info', 'Contact Details', 'Account Setup', 'Security']

export function RegisterPage() {
  const { isConfigured, signUp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [notice, setNotice] = useState('')
  const [preferredCurrency, setPreferredCurrency] = useState<Currency>('USD')
  const [details, setDetails] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    const currentDetails = Object.fromEntries(new FormData(event.currentTarget).entries())
    const allDetails = { ...details, ...Object.fromEntries(Object.entries(currentDetails).map(([key, value]) => [key, String(value)])) }
    if (step < steps.length - 1) {
      setDetails(allDetails)
      setStep((current) => current + 1)
      return
    }
    if (currentDetails.password !== currentDetails.confirmPassword) {
      setNotice('The passwords do not match. Please try again.')
      return
    }
    setIsSubmitting(true)
    try {
      const signedIn = await signUp({
        email: allDetails.email,
        password: String(currentDetails.password),
        profile: {
          first_name: allDetails.firstName,
          middle_name: allDetails.middleName ?? '',
          last_name: allDetails.lastName,
          username: allDetails.username,
          phone: allDetails.phone,
          country: allDetails.country,
          city: allDetails.city,
          account_type: allDetails.accountType,
          currency: allDetails.currency,
          account_purpose: allDetails.accountPurpose,
        },
      })
      if (signedIn) {
        navigate('/dashboard', { replace: true })
      } else {
        setNotice('Your account was created. Check your email for a confirmation link, then sign in.')
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to create your account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout pageTitle="Create Your Account">
      <div className="auth-card register-card">
        <div className="auth-card-top">
          <div className="auth-card-heading">
            <h2>Create Your Account</h2>
            <span>Step {step + 1} of {steps.length}</span>
          </div>
          <div className="auth-progress-track" aria-label={`Step ${step + 1} of ${steps.length}`}>
            <span style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
          <div className="auth-step-labels">
            {steps.map((label, index) => (
              <span className={index === step ? 'step-label is-current' : 'step-label'} key={label}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <form className="auth-form-content" onSubmit={handleNext}>
          <div className="auth-step-intro">
            <span className="auth-step-icon">
              {step === 0 && <UserRound size={25} />}
              {step === 1 && <ContactRound size={25} />}
              {step === 2 && <Landmark size={25} />}
              {step === 3 && <LockKeyhole size={25} />}
            </span>
            <h3>{steps[step] === 'Personal Info' ? 'Personal Information' : steps[step]}</h3>
            <p>{[
              'Please provide your legal name as it appears on official documents',
              'Add your contact information so we can keep you up to date',
              'Choose the account details that are right for you',
              'Create a password to help keep your account secure',
            ][step]}</p>
          </div>

          {step === 0 && <PersonalInfoFields values={details} />}
          {step === 1 && <ContactFields values={details} />}
          {step === 2 && <AccountFields values={details} preferredCurrency={preferredCurrency} onCurrencyChange={setPreferredCurrency} />}
          {step === 3 && <SecurityFields />}

          <div className="auth-form-actions">
            {step > 0 ? (
              <button className="auth-back-button" type="button" onClick={() => { setStep((current) => current - 1); setNotice('') }}>
                <ArrowLeft size={16} /> Back
              </button>
            ) : <span />}
            <button className="auth-next-button" type="submit" disabled={!isConfigured || isSubmitting}>
              {isSubmitting ? 'Creating account…' : step === steps.length - 1 ? 'Create Account' : 'Next'}
              {step === steps.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}
            </button>
          </div>
          {!isConfigured && <div className="auth-notice" role="alert">Supabase is not configured. Set the required environment variables to enable registration.</div>}
          {notice && <div className="auth-notice" role="status">{notice}</div>}
        </form>

        <div className="auth-card-footer">
          Already have an account? <Link to="/login">Sign in instead</Link>
        </div>
      </div>
    </AuthLayout>
  )
}

function PersonalInfoFields({ values }: { values: Record<string, string> }) {
  return (
    <div className="auth-fields-grid">
      <label className="auth-field">Legal First Name *
        <input name="firstName" autoComplete="given-name" placeholder="John" defaultValue={values.firstName ?? ''} required />
      </label>
      <label className="auth-field">Middle Name
        <input name="middleName" autoComplete="additional-name" placeholder="David" defaultValue={values.middleName ?? ''} />
      </label>
      <label className="auth-field">Legal Last Name *
        <input name="lastName" autoComplete="family-name" placeholder="Smith" defaultValue={values.lastName ?? ''} required />
      </label>
      <label className="auth-field">Username *
        <input name="username" autoComplete="username" placeholder="johnsmith123" defaultValue={values.username ?? ''} required />
      </label>
    </div>
  )
}

function ContactFields({ values }: { values: Record<string, string> }) {
  return (
    <div className="auth-fields-grid">
      <label className="auth-field">Email Address *
        <input name="email" type="email" autoComplete="email" placeholder="john@example.com" defaultValue={values.email ?? ''} required />
      </label>
      <label className="auth-field">Phone Number *
        <input name="phone" type="tel" autoComplete="tel" placeholder="+1 (555) 000-0000" defaultValue={values.phone ?? ''} required />
      </label>
      <label className="auth-field">Country *
        <select name="country" autoComplete="country-name" defaultValue={values.country ?? ''} required>
          <option value="" disabled>Select your country</option>
          <option>United States</option>
          <option>United Kingdom</option>
          <option>Canada</option>
          <option>Other</option>
        </select>
      </label>
      <label className="auth-field">City *
        <input name="city" autoComplete="address-level2" placeholder="Charlotte" defaultValue={values.city ?? ''} required />
      </label>
    </div>
  )
}

function AccountFields({
  preferredCurrency,
  onCurrencyChange,
  values,
}: {
  preferredCurrency: Currency
  onCurrencyChange: (currency: Currency) => void
  values: Record<string, string>
}) {
  return (
    <div className="auth-fields-grid">
      <label className="auth-field">Account Type *
        <select name="accountType" defaultValue={values.accountType ?? ''} required>
          <option value="" disabled>Select an account type</option>
          <option>Current Account</option>
          <option>Savings Account</option>
          <option>Business Account</option>
          <option>Investment Account</option>
        </select>
      </label>
      <label className="auth-field">Preferred Currency *
        <select
          name="currency"
          value={preferredCurrency}
          onChange={(event) => {
            const value = event.currentTarget.value
            if (isCurrency(value)) onCurrencyChange(value)
          }}
          required
        >
          {currencyOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="auth-field auth-field-full">How will you primarily use your account?
        <select name="accountPurpose" defaultValue={values.accountPurpose ?? 'Personal banking'}>
          <option>Personal banking</option>
          <option>Refund processing</option>
          <option>Business banking</option>
        </select>
      </label>
    </div>
  )
}

function SecurityFields() {
  return (
    <div className="auth-fields-grid">
      <label className="auth-field auth-field-full">Create Password *
        <input name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required />
      </label>
      <label className="auth-field auth-field-full">Confirm Password *
        <input name="confirmPassword" type="password" autoComplete="new-password" placeholder="Re-enter your password" minLength={8} required />
      </label>
      <label className="auth-consent auth-field-full">
        <input type="checkbox" required />
        <span>I agree to the <Link to="/terms-and-condtitions/">Terms &amp; Conditions</Link> and privacy policy.</span>
      </label>
    </div>
  )
}
