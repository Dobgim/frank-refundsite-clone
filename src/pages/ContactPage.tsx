import { useState, type FormEvent } from 'react'
import { Clock3, Mail, MapPin, Phone } from 'lucide-react'
import { PageHero } from '../components/PageHero'

export function ContactPage() {
  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] = useState<'success' | 'error' | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setNoticeType('')
    setIsSubmitting(true)

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      })
      const result: unknown = await response.json().catch(() => null)
      const errorMessage =
        typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'Unable to send your message. Please try again or email info@whitehillesettlement.online.'

      if (!response.ok) throw new Error(errorMessage)

      form.reset()
      setNoticeType('success')
      setNotice('Thanks for reaching out. Your message has been sent to our team.')
    } catch (error) {
      setNoticeType('error')
      setNotice(error instanceof Error ? error.message : 'Unable to send your message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <PageHero
        eyebrow="We're here to help"
        title="Feel free to get in touch"
        description="With years of experience, we can help you find the right next step for your transaction concern."
      />
      <section className="section section-soft">
        <div className="container-site contact-layout">
          <div className="contact-form-panel">
            <span className="eyebrow">Leave your message</span>
            <h2>Don't hesitate to contact us</h2>
            <p>Tell us a little about what you need and our team will be happy to help.</p>
            <form className="contact-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
              <div className="form-row">
                <label>Name<input name="name" autoComplete="name" placeholder="Your name" maxLength={120} required /></label>
                <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required /></label>
              </div>
              <label>Subject<input name="subject" placeholder="How can we help?" maxLength={200} required /></label>
              <label>Your message<textarea name="message" rows={5} placeholder="Write your message here..." maxLength={5000} required /></label>
              <div className="contact-form-honeypot" aria-hidden="true">
                <label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
              </div>
              <button className="button button-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending…' : 'Send Message'} <span aria-hidden="true">→</span>
              </button>
              {notice && <p className={`form-notice${noticeType === 'error' ? ' form-notice-error' : ''}`} role={noticeType === 'error' ? 'alert' : 'status'}>{notice}</p>}
              <p className="form-disclaimer">Your message will be emailed to our team. Do not include passwords or sensitive account information.</p>
            </form>
          </div>
          <aside className="contact-details">
            <div className="contact-details-heading"><span className="eyebrow">Contact information</span><h2>We’d love to hear from you.</h2></div>
            <ContactInfo icon={MapPin} title="Office" text="100 N Tryon St, Charlotte, NC 28202" />
            <ContactInfo icon={Clock3} title="Work Hours" text="Every day, 07 am – 07 pm" />
            <ContactInfo icon={Phone} title="Customer Support" text="Live Chat" />
            <ContactInfo icon={Mail} title="Email" text="info@whitehillesettlement.online" />
            <img className="contact-decoration" src="/assets/indian-operator-assistant-using-a-microphone-headset-while-conversing-with-a-customer.webp" alt="" />
          </aside>
        </div>
      </section>
    </>
  )
}

function ContactInfo({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof MapPin
  title: string
  text: string
}) {
  return (
    <div className="contact-info">
      <span className="contact-info-icon"><Icon size={19} /></span>
      <div><strong>{title}</strong><span>{text}</span></div>
    </div>
  )
}
