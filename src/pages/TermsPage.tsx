import { PageHero } from '../components/PageHero'

export function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="The details that matter"
        title="Terms & Conditions"
        description="A transparent guide to our process, fees, and what you can expect."
      />
      <section className="section section-soft">
        <article className="container-site legal-content">
          <p className="legal-intro">How Fund Recovery Works at Whitehill</p>
          <h2>1. Do you qualify for our services?</h2>
          <p>At Whitehill, we are committed to providing effective and ethical fund recovery services. To ensure we can dedicate the necessary resources to your case, we use the following qualification criterion:</p>
          <p><strong>Minimum claim amount:</strong> We can only accept cases where the amount lost is <strong>$1,000 USD or greater.</strong></p>
          <p>Tracing and recovering funds involves investigative work, legal outreach, and administrative resources. For amounts below $1,000, the cost and complexity may outweigh the potential recovery. If your loss meets this criterion, we encourage you to read on and begin your recovery journey.</p>

          <h2>2. Our ethical and transparent fee structure</h2>
          <p>We operate on a <strong>“No Recovery, No Fee”</strong> contingency model. You pay nothing upfront. Fees are contingent upon successfully recovering funds to your account.</p>
          <p><strong>Success fee:</strong> A single fee of 15% to 25% of the total amount recovered. The exact percentage is determined by the total recovered amount; larger recoveries are subject to the lower end of the range.</p>
          <p><strong>What does this fee cover?</strong> The fee supports the recovery team, operational and legal costs, secure data management, and applicable financial institution and network fees.</p>
          <p>This model is designed to align our interests with yours: we succeed when you do.</p>

          <h2>3. Our four-step fund recovery process</h2>
          <h3>Step 1: Free case review and account creation</h3>
          <p>Provide the initial details of your case. If your claim is over $1,000, our team can guide you through creating a refund account.</p>
          <p><strong>Information that may help:</strong> transaction references, statements, related emails or messages, platform information, and any police report you have filed. If you are missing details, our team can explain what may be useful.</p>
          <h3>Step 2: In-depth investigation and tracing</h3>
          <p>Our team reviews the available information and follows the appropriate process. For bank transfers, we analyze routing information and work through the relevant financial channels. Cryptocurrency tracing may involve on-chain analysis and exchange liaison.</p>
          <h3>Step 3: Legal action and strategic pressure</h3>
          <p>Where appropriate, this may include filing complaints with relevant regulatory bodies or law enforcement, issuing demand letters, and seeking to freeze destination accounts holding funds.</p>
          <h3>Step 4: Asset recovery and secure return</h3>
          <p>When funds are secured, we coordinate the return to your designated bank account or wallet. Recovery timelines vary with the complexity of each case; the reference site notes that cases typically take one to four weeks.</p>

          <h2>4. Privacy, data security, and confidentiality</h2>
          <p>Your trust and the security of your data are priorities. Information you provide is treated confidentially, used for the purpose of reviewing your case, and not sold, rented, or traded. You may request access to or deletion of your data by contacting us.</p>

          <h2>No guarantee of outcome</h2>
          <p>Services are provided on a best-efforts basis. We do not and cannot guarantee a successful outcome or the recovery of funds. A claim’s outcome depends on factors outside our direct control.</p>

          <h2>Client responsibilities</h2>
          <p>You agree to provide accurate and complete information, cooperate with reasonable requests for documentation, and act in good faith throughout the process.</p>

          <h2>Limitation of liability</h2>
          <p>To the fullest extent permitted by law, the company’s total liability for a claim arising from these terms or our services is limited to the fees paid in the six months before the event giving rise to the claim. We are not liable for indirect, incidental, or consequential damages.</p>

          <h2>Governing law and changes to these terms</h2>
          <p>These terms are governed by the laws applicable to the company and the services provided. We reserve the right to modify these terms; changes are effective when posted. Continued use of our services after changes are posted constitutes acceptance of the updated terms.</p>
          <p className="legal-updated">By engaging our services, you acknowledge and agree to these terms and our data handling practices.</p>
        </article>
      </section>
    </>
  )
}
