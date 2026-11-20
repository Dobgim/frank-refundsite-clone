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
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'

const steps = ['Personal Info', 'Contact Details', 'Account Setup', 'Security']

export function RegisterPage() {
  const [step, setStep] = useState(0)
  const [notice, setNotice] = useState('')
  const [showDashboardLink, setShowDashboardLink] = useState(false)

  function handleNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setShowDashboardLink(false)
    if (step < steps.length - 1) {
      setStep((current) => current + 1)
      return
    }
    const formData = new FormData(event.currentTarget)
    if (formData.get('password') !== formData.get('confirmPassword')) {
      setNotice('The passwords do not match. Please try again.')
      return
    }
    setNotice('Registration preview only. Your information has not been sent or saved.')
    setShowDashboardLink(true)
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

          {step === 0 && <PersonalInfoFields />}
          {step === 1 && <ContactFields />}
          {step === 2 && <AccountFields />}
          {step === 3 && <SecurityFields />}

          <div className="auth-form-actions">
            {step > 0 ? (
              <button className="auth-back-button" type="button" onClick={() => { setStep((current) => current - 1); setNotice('') }}>
                <ArrowLeft size={16} /> Back
              </button>
            ) : <span />}
            <button className="auth-next-button" type="submit">
              {step === steps.length - 1 ? 'Create Account' : 'Next'}
              {step === steps.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}
            </button>
          </div>
          {notice && <div className="auth-notice" role="status"><p>{notice}</p>{showDashboardLink && <Link className="auth-demo-link" to="/dashboard">Open sample dashboard</Link>}</div>}
        </form>

        <div className="auth-card-footer">
          Already have an account? <Link to="/login">Sign in instead</Link>
        </div>
      </div>
    </AuthLayout>
  )
}

function PersonalInfoFields() {
  return (
    <div className="auth-fields-grid">
      <label className="auth-field">Legal First Name *
        <input name="firstName" autoComplete="given-name" placeholder="John" required />
      </label>
      <label className="auth-field">Middle Name
        <input name="middleName" autoComplete="additional-name" placeholder="David" />
      </label>
      <label className="auth-field">Legal Last Name *
        <input name="lastName" autoComplete="family-name" placeholder="Smith" required />
      </label>
      <label className="auth-field">Username *
        <input name="username" autoComplete="username" placeholder="johnsmith123" required />
      </label>
    </div>
  )
}

function ContactFields() {
  return (
    <div className="auth-fields-grid">
      <label className="auth-field">Email Address *
        <input name="email" type="email" autoComplete="email" placeholder="john@example.com" required />
      </label>
      <label className="auth-field">Phone Number *
        <input name="phone" type="tel" autoComplete="tel" placeholder="+1 (555) 000-0000" required />
      </label>
      <label className="auth-field">Country *
        <select name="country" autoComplete="country-name" defaultValue="" required>
          <option value="" disabled>Select your country</option>
          <option>United States</option>
          <option>United Kingdom</option>
          <option>Canada</option>
          <option>Other</option>
        </select>
      </label>
      <label className="auth-field">City *
        <input name="city" autoComplete="address-level2" placeholder="Charlotte" required />
      </label>
    </div>
  )
}

function AccountFields() {
  return (
    <div className="auth-fields-grid">
      <label className="auth-field">Account Type *
        <select name="accountType" defaultValue="" required>
          <option value="" disabled>Select an account type</option>
          <option>Current Account</option>
          <option>Savings Account</option>
          <option>Business Account</option>
          <option>Investment Account</option>
        </select>
      </label>
      <label className="auth-field">Preferred Currency *
        <select name="currency" defaultValue="USD" required>
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="CAD">CAD - Canadian Dollar</option>
        </select>
      </label>
      <label className="auth-field auth-field-full">How will you primarily use your account?
        <select name="accountPurpose" defaultValue="Personal banking">
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
