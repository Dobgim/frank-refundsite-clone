import { ArrowRight, Globe2, LockKeyhole, ShieldCheck, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { SectionHeading } from '../components/SectionHeading'
import { accountUrl } from '../components/SiteLayout'

const values = [
  { icon: Zap, title: 'Speed', text: 'We combine banking expertise and streamlined systems to process refund claims as efficiently as possible.' },
  { icon: Globe2, title: 'Global Access', text: 'We serve customers from around the world across multiple currencies, payment methods, and transaction types.' },
  { icon: LockKeyhole, title: 'Security', text: 'Secure banking practices help protect every claim and keep personal information confidential.' },
]

const strengths = [
  'Your first step to a refund',
  'Why Whitehill stands apart',
  'Peace of mind beyond the refund',
  'The Whitehill advantage',
  'Turning disputes into resolutions',
]

export function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Who we are"
        title="About Whitehill"
        description="A trusted refund processing institution built around transparency, compliance, and customer-first banking."
      >
        <a className="button button-primary" href={accountUrl}>Let’s work together <ArrowRight size={16} /></a>
      </PageHero>
      <section className="section section-soft">
        <div className="container-site about-intro">
          <div className="about-image">
            <img src="/assets/handsome-businessman-in-formal-wear-and-glasses-holding-documents.webp" alt="Whitehill team member" />
            <div className="about-image-label"><ShieldCheck size={21} /><span>Built on trust<br /><strong>Guided by transparency</strong></span></div>
          </div>
          <div className="about-copy">
            <span className="eyebrow">Our story</span>
            <h2>A dedicated partner for a more confident refund journey.</h2>
            <p>
              Whitehill Settlement was established with a singular vision: to
              become a trusted and reliable refund processing institution for
              customers worldwide. We’re built on the principles of transparency,
              compliance, and customer-first banking.
            </p>
            <p>
              We invest in developing and maintaining secure systems for
              transaction and refund processing. Our team works to handle every
              claim with care, accuracy, and clear communication.
            </p>
            <div className="about-stats">
              <div><strong>99.9%</strong><span>Client satisfaction</span></div>
              <div><strong>$124M</strong><span>Funds recovered</span></div>
              <div><strong>16,873+</strong><span>Registered customers</span></div>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container-site mission-grid">
          <div className="mission-card mission-vision">
            <span className="eyebrow">Our vision</span>
            <h2>To become a leading global institution for reliable and transparent refund processing.</h2>
            <span className="mission-mark">01</span>
          </div>
          <div className="mission-card mission-purpose">
            <span className="eyebrow">Our mission</span>
            <h2>Give every customer a secure, straightforward, and professional experience.</h2>
            <span className="mission-mark">02</span>
          </div>
        </div>
      </section>
      <section className="section section-dark">
        <div className="container-site">
          <SectionHeading
            eyebrow="Here for every step"
            title="Protecting customers in an uncertain financial landscape"
            description="Disputed transactions and unresolved refunds are increasingly common. We’re here to give customers a reliable channel to understand their options and move forward."
            centered
          />
          <div className="strength-grid">
            {strengths.map((title, index) => (
              <article key={title}>
                <span>0{index + 1}</span><h3>{title}</h3>
                <p>{[
                  'Submit your claim and our team will explain the process and keep you informed.',
                  'Our focus is on refund processing and a dedicated experience for every customer.',
                  'Know what is happening with your case with regular, clear updates.',
                  'Every case is reviewed individually and handled with care.',
                  'A transaction dispute can feel overwhelming. We help make the next steps clearer.',
                ][index]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container-site">
          <SectionHeading eyebrow="Our core values" title="What guides the way we work" centered />
          <div className="value-grid">
            {values.map(({ icon: Icon, title, text }) => (
              <article className="value-card" key={title}><span className="service-icon"><Icon size={22} /></span><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-soft">
        <div className="container-site numbers-layout">
          <div>
            <span className="eyebrow">Our numbers talk</span>
            <h2>We keep our focus on results that matter.</h2>
            <p>Each claim is different. Our team reviews every case carefully and provides a realistic view of the process.</p>
          </div>
          <div className="progress-list">
            {[
              ['Ecommerce refund success rate', 90],
              ['Billing dispute resolution', 96],
              ['Online transaction refunds', 92],
              ['Logistics and shipping claims', 89],
            ].map(([label, amount]) => (
              <div className="progress-item" key={label}>
                <div><span>{label}</span><strong>{amount}%</strong></div>
                <span className="progress-track"><span style={{ width: `${amount}%` }} /></span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container-site methodology">
          <div className="method-image"><img src="/assets/portrait-of-an-african-woman-smiling.webp" alt="A Whitehill customer" /></div>
          <div><span className="eyebrow">Our proven methodology</span><h2>Start with a conversation.</h2><p>Our specialists review your case, help you understand what information may be useful, and explain the next steps with clarity.</p><Link className="button button-dark" to="/contact/">Contact Us <ArrowRight size={16} /></Link></div>
        </div>
      </section>
    </>
  )
}
