import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpFromLine,
  BriefcaseBusiness,
  Building2,
  CreditCard,
  Landmark,
  Scale,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-react'
import { PageHero } from '../components/PageHero'
import { SectionHeading } from '../components/SectionHeading'
import { accountUrl } from '../components/SiteLayout'

const serviceFeatures = [
  { icon: ArrowUpFromLine, title: 'Withdraw Funds', text: 'We make it easy to withdraw funds quickly and securely. Whether you’re recovering money from a chargeback, refund, or financial dispute, our seamless withdrawal process ensures you receive your funds.' },
  { icon: ArrowDownToLine, title: 'Deposit Funds', text: 'Depositing funds is simple and secure. We offer a streamlined and protected process you can use with confidence.' },
  { icon: ArrowLeftRight, title: 'Fast Transfer', text: 'We provide fast transfer services to support the secure movement of funds through reliable financial channels.' },
  { icon: Scale, title: 'Legal Support', text: 'We help individuals and organizations understand, navigate, and comply with the legal requirements related to their case.' },
  { icon: Wallet, title: 'Financial Management', text: 'We help businesses plan, organize, control, and monitor their financial resources to support future goals.' },
]

const serviceGroups = [
  { icon: Landmark, title: 'Retail Banking Services', items: ['Personal savings accounts', 'Checking accounts', 'ATM and branch banking', 'Mortgage services', 'Personal loans', 'Debit and credit cards'] },
  { icon: BriefcaseBusiness, title: 'Corporate Banking Services', items: ['Business loans and credit lines', 'Cash management services', 'Trade finance', 'Credit and debt management', 'Corporate credit cards', 'Merchant services'] },
  { icon: Building2, title: 'International Banking Services', items: ['Foreign exchange services', 'Cross-border payments', 'International wire transfers', 'Export/import financing', 'Offshore banking', 'Multicurrency accounts'] },
  { icon: Smartphone, title: 'Digital Banking Services', items: ['Online account opening', 'Mobile banking apps', 'Digital wallets', 'Peer-to-peer payments', 'Fraud monitoring', 'Chatbot customer support'] },
  { icon: ShieldCheck, title: 'Refund Services', items: ['Logistics and shipping claims', 'Online transaction refunds', 'Billing dispute resolution', 'Ecommerce refunds', 'Identity theft', 'Chargeback refunds'] },
  { icon: CreditCard, title: 'Loan Services', items: ['Personal loans', 'Mortgage loans', 'Business loans', 'Emergency loans', 'Education loans', 'Auto loans'] },
]

export function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="How we help"
        title="Services"
        description="We provide clear information about our services and how they can help individuals and businesses find a path forward."
      >
        <a className="button button-primary" href={accountUrl}>Request a Service <ArrowRight size={16} /></a>
      </PageHero>
      <section className="section section-soft">
        <div className="container-site service-intro">
          <div><span className="eyebrow">Support when you need it</span><h2>We Handle the Complexity, You Reclaim Peace</h2></div>
          <p>Complicated paperwork? Submit your claim and our team can help you understand the documentation, communicate through the appropriate financial channels, and follow the process with you.</p>
        </div>
      </section>
      <section className="section section-tight">
        <div className="container-site service-grid">
          {serviceFeatures.map(({ icon: Icon, title, text }, index) => (
            <article className={`service-card ${index === 0 ? 'service-card-featured' : ''}`} key={title}>
              <span className="service-icon"><Icon size={23} /></span><h3>{title}</h3><p>{text}</p><a href={accountUrl} aria-label={`Request ${title}`}><ArrowRight size={18} /></a>
            </article>
          ))}
        </div>
      </section>
      <section className="service-cta-band">
        <div className="container-site service-cta-content">
          <div><span className="eyebrow">Find out more about our service</span><h2>Let’s talk about what you need.</h2><p>Consult with our team and get clear information about the available next steps.</p></div>
          <a className="button button-light" href={accountUrl}>Request Service <ArrowRight size={17} /></a>
        </div>
      </section>
      <section className="section">
        <div className="container-site">
          <SectionHeading eyebrow="It's easy to work with us" title="Our simple 4 step process" centered />
          <div className="process-grid">
            {[
              ['01', 'Create Account', 'Open an account to begin your request.'],
              ['02', 'Verify Account', 'Verify your email and identity to help keep your account secure.'],
              ['03', 'Get Service', 'Request the service you need as an account holder.'],
              ['04', 'Withdraw Funds', 'When funds are returned, choose how they should be moved.'],
            ].map(([number, title, text]) => (
              <article className="process-card" key={number}><span className="process-number">{number}</span><span className="process-line" /><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-soft">
        <div className="container-site">
          <SectionHeading eyebrow="Solutions for every stage" title="Explore our services" description="Our goal is to provide reliable banking and financial recovery solutions for individuals and businesses." centered />
          <div className="service-groups">
            {serviceGroups.map(({ icon: Icon, title, items }) => (
              <article className="service-group" key={title}>
                <div className="service-group-title"><span className="service-icon"><Icon size={21} /></span><h3>{title}</h3></div>
                <ul>{items.map((item) => <li key={item}><span />{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
