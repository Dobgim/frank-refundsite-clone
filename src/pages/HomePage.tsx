import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpFromLine,
  BadgeCheck,
  ChevronDown,
  CircleDollarSign,
  FileCheck2,
  Landmark,
  Scale,
  ShieldCheck,
  Star,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { accountUrl } from '../components/SiteLayout'
import { SectionHeading } from '../components/SectionHeading'

const serviceCards = [
  {
    icon: ArrowUpFromLine,
    title: 'Withdraw Funds',
    text: "We make it easy to withdraw funds quickly and securely. Whether you're recovering money from a chargeback, refund, or financial dispute, our seamless withdrawal process ensures that you receive your funds.",
  },
  {
    icon: ArrowDownToLine,
    title: 'Deposit Funds',
    text: 'Depositing funds is simple and secure. Our streamlined process keeps every transaction protected and easy to follow.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Fast Transfer',
    text: 'Our fast transfer services support the quick and secure movement of funds through reliable financial channels.',
  },
  {
    icon: Scale,
    title: 'Legal Support',
    text: 'We help individuals and organizations understand, navigate, and comply with the legal requirements of their case.',
  },
  {
    icon: CircleDollarSign,
    title: 'Financial Management',
    text: 'We help businesses plan, organize, and monitor financial resources to support their goals for the future.',
  },
]

const testimonials = [
  {
    name: 'Andy James',
    handle: '@andyjames',
    image: 'handsome-caucasian-man-smiling-with-arms-crossed-1.webp',
    rating: '4.9',
    quote: 'I requested a refund after an online purchase went completely wrong. Whitehill Settlement handled everything professionally and returned my money with zero stress.',
  },
  {
    name: 'Ned Barnett',
    handle: '@nedbarnet',
    image: 'young-woman-smiling-cheerful-concept.webp',
    rating: '5.0',
    quote: 'I had a complicated transaction dispute and didn’t know where to turn. Whitehill Settlement walked me through the entire process.',
  },
  {
    name: 'Henry Ballard',
    handle: '@henryblrd',
    image: 'young-man-with-redhead-beard-and-cap.webp',
    rating: '4.8',
    quote: 'Whitehill stepped in and got my disputed transaction sorted without me having to deal with anyone directly.',
  },
  {
    name: 'Shana Matthews',
    handle: '@shana.mtw',
    image: 'portrait-of-a-woman.webp',
    rating: '4.9',
    quote: 'The team kept me informed throughout. The process felt clear, professional, and much less stressful than I expected.',
  },
]

const customerJourneys = [
  {
    image: 'young-woman-smiling-cheerful-concept.webp',
    alt: 'Illustrative portrait for an online purchase support story',
    title: 'An online purchase didn’t go to plan',
    text: 'Understand what information can help when an order or service differs from what you expected.',
  },
  {
    image: 'portrait-of-an-african-woman-smiling.webp',
    alt: 'Illustrative portrait for a billing support story',
    title: 'A bill or charge looks unfamiliar',
    text: 'Get guidance on organizing statements and transaction details before you decide what to do next.',
  },
  {
    image: 'handsome-cool-african-man-smiling-against-red-back.webp',
    alt: 'Illustrative portrait for a delivery support story',
    title: 'A delivery issue needs attention',
    text: 'Keep order records and communications together while you review available dispute options.',
  },
  {
    image: 'young-african-american-man-smiling.webp',
    alt: 'Illustrative portrait for a transaction support story',
    title: 'You want help understanding a transaction',
    text: 'Our team can explain the process and help you identify the documents relevant to your request.',
  },
]

const faqs = [
  {
    question: 'What types of refunds does Whitehill Settlement handle?',
    answer: 'We process a wide range of transaction disputes, including ecommerce purchases, delivery issues, subscription cancellations, billing errors, and unauthorized transactions.',
  },
  {
    question: 'How does the refund process work?',
    answer: 'Start by creating an account and sharing your claim details. Our team reviews your case, explains the next steps, and keeps you updated as it moves through the appropriate channels.',
  },
  {
    question: 'What information should I prepare?',
    answer: 'Transaction references, receipts, statements, and any communication related to the purchase can help us understand your case.',
  },
]

export function HomePage() {
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <>
      <section className="home-hero">
        <div className="home-hero-backdrop" />
        <div className="container-site home-hero-inner">
          <div className="hero-copy">
            <span className="hero-kicker"><span>👋</span> Hi, Let’s work together</span>
            <h1>Trusted Partner in <span>Refund Processing</span></h1>
            <p>
              We are a fully licensed financial institution specializing in refund
              processing and transaction management. Whatever you paid for,
              wherever you paid, if you’re owed money, we make sure you get it back.
            </p>
            <a className="button button-primary" href={accountUrl}>
              Get Started <ArrowRight size={17} />
            </a>
          </div>
          <div className="hero-visual">
            <div className="hero-photo">
              <img
                src="/assets/handsome-businessman-in-formal-wear-and-glasses-holding-documents.webp"
                alt="Whitehill customer specialist"
              />
            </div>
            <div className="hero-float-card">
              <span className="float-icon"><ShieldCheck size={19} /></span>
              <div><strong>Here for you</strong><small>Every step of the way</small></div>
              <BadgeCheck size={18} className="verified-icon" />
            </div>
            <div className="hero-orbit" />
          </div>
        </div>
        <div className="container-site hero-stats">
          <div><strong>99.9<span>%</span></strong><span>Client satisfaction</span></div>
          <div><strong>$624<span>M</span></strong><span>Refund settlement</span></div>
          <div><strong>96,873<span>+</span></strong><span>Registered customers</span></div>
        </div>
      </section>

      <section className="logo-strip container-site">
        <div className="logo-strip-label">Trusted by people and businesses around the world</div>
        <div className="partner-logos">
          {['u.webp', 'vivio.webp', 'rech.webp', 'hightech.webp', 'minty.webp'].map((logo) => (
            <img key={logo} src={`/assets/${logo}`} alt="" />
          ))}
        </div>
      </section>

      <section className="section section-soft">
        <div className="container-site feature-intro">
          <div className="feature-collage">
            <img className="collage-main" src="/assets/happy-adult-businesswoman-holding-folder-and-pencil-near-table-in-office.webp" alt="Customer reviewing important documents" />
            <img className="collage-note" src="/assets/card-visitor.webp" alt="" />
            <div className="collage-badge"><ShieldCheck size={20} /><span>Clear updates.<br /><strong>Real people.</strong></span></div>
          </div>
          <div className="feature-copy">
            <span className="eyebrow">A simpler way to move forward</span>
            <h2>We Handle the Complexity, <span>You Reclaim Peace</span></h2>
            <p>
              Complicated paperwork? Simply submit your claim to us and we take it
              from there. We handle the necessary documentation, communicate with
              the appropriate financial institutions, and keep you updated every
              step of the way.
            </p>
            <div className="check-list">
              <span><FileCheck2 size={18} /> Clear guidance from our team</span>
              <span><ShieldCheck size={18} /> Careful and secure handling</span>
              <span><ArrowLeftRight size={18} /> Updates throughout your case</span>
            </div>
            <Link className="text-link" to="/about/">Learn more about us <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-site">
          <SectionHeading
            eyebrow="How we can help"
            title="Support built around your next step"
            description="From the first question to the final update, our team helps make a complex process easier to understand."
            centered
          />
          <div className="service-grid">
            {serviceCards.map(({ icon: Icon, title, text }, index) => (
              <article className={`service-card ${index === 0 ? 'service-card-featured' : ''}`} key={title}>
                <span className="service-icon"><Icon size={23} strokeWidth={1.7} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
                <Link to="/services/" aria-label={`Learn about ${title}`}><ArrowRight size={18} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section split-section">
        <div className="container-site split-content">
          <div className="split-image">
            <img src="/assets/handsome-businessman-in-formal-wear-and-glasses-holding-documents.webp" alt="A professional ready to help" />
            <div className="split-image-caption"><Landmark size={20} /><span>Clear answers.<br /><strong>Thoughtful support.</strong></span></div>
          </div>
          <div className="split-copy">
            <span className="eyebrow">Trust in a sea of doubt</span>
            <h2>Every customer deserves a clear, secure path forward.</h2>
            <p>
              Worried about submitting your refund request to the wrong place?
              Whitehill Bank is committed to full transparency. Verify our
              credentials, read client testimonials, and compare our results.
            </p>
            <div className="account-types">
              {['Current account', 'Crypto currency account', 'Business account', 'Savings account', 'Fixed deposit account', 'Investment account'].map((name) => (
                <span key={name}><Wallet size={16} /> {name}</span>
              ))}
            </div>
            <a className="button button-dark" href={accountUrl}>Create Account <ArrowRight size={16} /></a>
          </div>
        </div>
      </section>

      <section className="section journey-section">
        <div className="container-site">
          <SectionHeading
            eyebrow="Support for real-life situations"
            title="A clear next step starts with understanding your situation"
            description="Every case is different. These examples show the kinds of transaction questions our team can help you organize and review."
            centered
          />
          <div className="journey-grid">
            {customerJourneys.map((journey) => (
              <article className="journey-card" key={journey.title}>
                <div className="journey-image">
                  <img src={`/assets/${journey.image}`} alt={journey.alt} loading="lazy" />
                  <span>How we can help</span>
                </div>
                <div className="journey-card-copy">
                  <h3>{journey.title}</h3>
                  <p>{journey.text}</p>
                  <Link to="/services/">Explore support <ArrowRight size={15} /></Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section testimonial-section">
        <div className="container-site">
          <div className="testimonial-heading">
            <SectionHeading
              eyebrow="Positive feedback"
              title="See what our customers are saying"
              description="We’re proud to support people as they work through a difficult financial moment."
            />
            <div className="rating-summary"><strong>4.9</strong><span><span className="stars">★★★★★</span><small>Rated 4.9 out of 5</small></span></div>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((item) => (
              <article className="testimonial-card" key={item.name}>
                <div className="testimonial-rating"><span className="stars">★★★★★</span><span>{item.rating} Rated</span></div>
                <p>“{item.quote}”</p>
                <div className="testimonial-author">
                  <img src={`/assets/${item.image}`} alt="" />
                  <div><strong>{item.name}</strong><span>{item.handle}</span></div>
                  <Star size={16} className="author-star" fill="currentColor" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section process-section">
        <div className="container-site">
          <SectionHeading
            eyebrow="It's easy to work with us"
            title="A clear process, from day one"
            description="We keep the steps simple and stay by your side at each stage."
            centered
          />
          <div className="process-grid">
            {[
              ['01', 'Create Account', 'Start with a secure account and tell us a little about your case.'],
              ['02', 'Verify Account', 'Verify your email and identity so we can protect your information.'],
              ['03', 'Request Service', 'Share the details and documents that help explain your claim.'],
              ['04', 'Stay Informed', 'Follow updates from our team while your case is reviewed.'],
            ].map(([number, title, text]) => (
              <article className="process-card" key={number}>
                <span className="process-number">{number}</span><span className="process-line" />
                <h3>{title}</h3><p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section pricing-section">
        <div className="container-site">
          <SectionHeading
            eyebrow="Straightforward options"
            title="Choose the support that fits"
            description="Transparent service options, with no confusing surprises."
            centered
          />
          <div className="pricing-grid">
            <PlanCard title="Standard" price="$42.00" features={['Basic reporting and analytics', 'Free consultation', 'Audit log and data history', 'Customer support']} />
            <PlanCard title="Premium+" price="$64.00" popular features={['Premium reporting and analytics', 'Free consultation', 'Priority chat and email support', 'Audit log and data history']} />
          </div>
          <p className="pricing-note">* Tax and other services included.</p>
        </div>
      </section>

      <section className="section faq-section">
        <div className="container-site faq-layout">
          <div>
            <span className="eyebrow">Frequently asked questions</span>
            <h2>Good questions deserve clear answers.</h2>
            <p>Still have a question? Our team is happy to help you figure out what comes next.</p>
            <Link className="text-link" to="/contact/">Talk to our team <ArrowRight size={17} /></Link>
          </div>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <article className={`faq-item ${openFaq === index ? 'faq-open' : ''}`} key={faq.question}>
                <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}>
                  <span>{faq.question}</span><ChevronDown size={19} />
                </button>
                {openFaq === index && <p>{faq.answer}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function PlanCard({
  title,
  price,
  features,
  popular = false,
}: {
  title: string
  price: string
  features: string[]
  popular?: boolean
}) {
  return (
    <article className={`plan-card ${popular ? 'plan-popular' : ''}`}>
      {popular && <span className="popular-tag">Popular</span>}
      <h3>{title}</h3>
      <div className="plan-price">{price}<small> / per service</small></div>
      <ul>{features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
      <a className={`button ${popular ? 'button-primary' : 'button-dark'}`} href={accountUrl}>Select Plan <ArrowRight size={16} /></a>
    </article>
  )
}
