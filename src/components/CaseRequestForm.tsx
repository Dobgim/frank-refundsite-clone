import { useState, type FormEvent } from 'react'
import { ArrowRight, Upload } from 'lucide-react'
import { getSupabase } from '../lib/supabase'
import type { CaseRequestType } from '../lib/database.types'
import { requestTypeLabels } from '../lib/cases'
import type { Currency } from '../currency'

const allowedFileTypes = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const maxFileSize = 10 * 1024 * 1024
const maxFiles = 5

export function CaseRequestForm({
  requestType,
  userId,
  currency,
  onSubmitted,
}: {
  requestType: CaseRequestType
  userId: string
  currency: Currency
  onSubmitted: () => Promise<void>
}) {
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const needsAmount = requestType === 'loan' || requestType === 'withdrawal'
  const isClaim = requestType === 'claim'
  const title = requestTypeLabels[requestType]

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setIsSubmitting(true)

    const form = event.currentTarget
    const data = new FormData(form)
    const files = data.getAll('documents').filter((value): value is File => value instanceof File && value.size > 0)
    const amountValue = String(data.get('amount') ?? '').trim()
    const amount = amountValue ? Number(amountValue) : null
    const termValue = String(data.get('loanTerm') ?? '').trim()
    let requestId = ''

    try {
      if (files.length > maxFiles) throw new Error(`Choose no more than ${maxFiles} documents.`)
      if (files.some((file) => !allowedFileTypes.has(file.type) || file.size > maxFileSize)) {
        throw new Error('Documents must be PDF, JPG, or PNG files no larger than 10 MB each.')
      }
      if (amountValue && (!Number.isFinite(amount) || (amount ?? 0) <= 0)) {
        throw new Error('Enter a valid amount greater than zero.')
      }

      const { data: request, error: requestError } = await getSupabase()
        .from('case_requests')
        .insert({
          user_id: userId,
          request_type: requestType,
          subject: String(data.get('subject') ?? '').trim(),
          details: String(data.get('details') ?? '').trim(),
          requested_amount: amount,
          currency: amount === null ? null : currency,
          loan_term_months: termValue ? Number(termValue) : null,
          transaction_reference: String(data.get('reference') ?? '').trim() || null,
        })
        .select('id')
        .single()

      if (requestError) throw requestError
      requestId = request.id

      for (const file of files) {
        const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_').slice(-100) || 'document'
        const storagePath = `${userId}/${requestId}/${crypto.randomUUID()}-${safeName}`
        const { error: uploadError } = await getSupabase()
          .storage
          .from('case-documents')
          .upload(storagePath, file, { contentType: file.type, cacheControl: '0', upsert: false })

        if (uploadError) throw uploadError

        const { error: metadataError } = await getSupabase()
          .from('case_documents')
          .insert({
            request_id: requestId,
            user_id: userId,
            storage_path: storagePath,
            file_name: file.name.slice(0, 255),
            mime_type: file.type,
            file_size: file.size,
          })

        if (metadataError) {
          const { error: cleanupError } = await getSupabase().storage.from('case-documents').remove([storagePath])
          if (cleanupError) {
            throw new Error(`The request was saved, but an uploaded file could not be linked or cleaned up. Contact support and provide request ID ${requestId}.`)
          }
          throw metadataError
        }
      }

      await onSubmitted()
      form.reset()
      setNotice(`Your ${title.toLowerCase()} request was submitted for review. Reference: ${requestId}`)
    } catch (error) {
      if (requestId) {
        await onSubmitted()
        form.reset()
        setNotice(`Request ${requestId} was saved, but an attachment could not be fully processed. Contact support with this reference. ${error instanceof Error ? error.message : ''}`)
      } else {
        setNotice(error instanceof Error ? error.message : 'Unable to submit your request. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="dashboard-panel dashboard-page-panel">
      <div className="dashboard-panel-heading">
        <div>
          <h2>{requestType === 'support' ? 'Contact customer service' : `New ${title.toLowerCase()}`}</h2>
          <p>Submissions are for staff review only; they do not move funds or guarantee approval.</p>
        </div>
      </div>
      <form className="dashboard-request-form" onSubmit={handleSubmit}>
        <label>Subject
          <input name="subject" maxLength={200} required placeholder={requestType === 'verification' ? 'What are you verifying?' : `Briefly describe your ${title.toLowerCase()}`} />
        </label>
        {isClaim && <label>Transaction reference (optional)<input name="reference" maxLength={120} /></label>}
        {(needsAmount || isClaim) && (
          <label>{needsAmount ? `Requested amount (${currency})` : `Claim amount (${currency}, optional)`}
            <input name="amount" type="number" min="0.01" step="0.01" required={needsAmount} />
          </label>
        )}
        {requestType === 'loan' && (
          <label>Preferred term
            <select name="loanTerm" defaultValue="">
              <option value="">Not specified</option>
              <option value="12">12 months</option>
              <option value="24">24 months</option>
              <option value="36">36 months</option>
              <option value="60">60 months</option>
            </select>
          </label>
        )}
        <label>{requestType === 'support' ? 'Message' : 'Details'}
          <textarea name="details" rows={5} maxLength={5000} required placeholder="Share only the information needed for this request." />
        </label>
        <p className="dashboard-muted-note">Never include passwords, PINs, CVVs, full card credentials, or account login details.</p>
        <label className="case-document-field">
          <span>Supporting documents (optional)</span>
          <span className="case-file-input"><Upload size={16} /><span>Choose up to 5 PDF, JPG, or PNG files</span><input name="documents" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple /></span>
          <small>Private to you and authorized administrators. Files are deleted 30 days after a request is marked resolved or declined. Do not upload passwords, PINs, CVVs, or full card credentials.</small>
        </label>
        {(requestType === 'withdrawal' || requestType === 'loan') && (
          <p className="dashboard-muted-note">Do not provide bank account numbers, card numbers, passwords, or PINs. This form only records a request for review; it cannot approve a loan or make a withdrawal.</p>
        )}
        <button className="dashboard-primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Submit for review'} <ArrowRight size={15} />
        </button>
        {notice && <p className="dashboard-form-notice" role="status">{notice}</p>}
      </form>
    </section>
  )
}
