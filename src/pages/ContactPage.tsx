import { useState, type FormEvent } from 'react'
import { Clock3, Mail, MapPin, Phone } from 'lucide-react'
import { PageHero } from '../components/PageHero'

export function ContactPage() {
  const [notice, setNotice] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('This preview is not connected to a messaging service. Please email info@whitehillesettlement.com.com to reach the team.')
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
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>Name<input name="name" autoComplete="name" placeholder="Your name" required /></label>
                <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
              </div>
              <label>Subject<input name="subject" placeholder="How can we help?" required /></label>
              <label>Your message<textarea name="message" rows={5} placeholder="Write your message here..." required /></label>
              <button className="button button-primary" type="submit">Send Message <span aria-hidden="true">→</span></button>
              {notice && <p className="form-notice" role="status">{notice}</p>}
              <p className="form-disclaimer">This local preview does not store or send submitted information.</p>
            </form>
          </div>
          <aside className="contact-details">
            <div className="contact-details-heading"><span className="eyebrow">Contact information</span><h2>We’d love to hear from you.</h2></div>
            <ContactInfo icon={MapPin} title="Office" text="100 N Tryon St, Charlotte, NC 28202" />
            <ContactInfo icon={Clock3} title="Work Hours" text="Every day, 07 am – 07 pm" />
            <ContactInfo icon={Phone} title="Customer Support" text="Live Chat" />
            <ContactInfo icon={Mail} title="Email" text="info@whitehillesettlement.com.com" />
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
