import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, Camera, CheckCircle2, Hourglass, RotateCcw, ShieldCheck, Upload, XCircle } from 'lucide-react'
import { getSupabase } from '../lib/supabase'
import type { Database, ProfileVerificationStatus, VerificationDocumentType } from '../lib/database.types'
import { documentTypeLabels } from '../lib/cases'

type IdentityVerification = Database['public']['Tables']['identity_verifications']['Row']

const bucket = 'identity-verifications'
const allowedFileTypes = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const maxFileSize = 10 * 1024 * 1024
const documentTypes: VerificationDocumentType[] = ['id_card', 'passport', 'license']

function extensionFor(file: Blob) {
  return file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'
}

function validateDocument(file: File | null, label: string) {
  if (!file) return
  if (!allowedFileTypes.has(file.type) || file.size > maxFileSize) {
    throw new Error(`${label} must be a PDF, JPG, or PNG file no larger than 10 MB.`)
  }
}

export function IdentityVerificationPanel({
  userId,
  status,
  latest,
  isLoading,
  loadError,
  onSubmitted,
}: {
  userId: string
  status: ProfileVerificationStatus
  latest: IdentityVerification | null
  isLoading: boolean
  loadError: string
  onSubmitted: () => Promise<void>
}) {
  if (isLoading) {
    return <section className="dashboard-panel dashboard-page-panel"><p className="dashboard-muted-note">Loading verification status…</p></section>
  }

  if (status === 'approved') {
    return (
      <section className="dashboard-panel dashboard-page-panel">
        <div className="verification-state verification-state-approved">
          <span><CheckCircle2 size={24} /></span>
          <div>
            <strong>Your identity is verified</strong>
            <p>You can now start claims and submit other requests from your dashboard.</p>
            {latest?.reviewed_at && <small>Approved on {new Date(latest.reviewed_at).toLocaleDateString()}</small>}
          </div>
        </div>
      </section>
    )
  }

  if (status === 'pending') {
    return (
      <section className="dashboard-panel dashboard-page-panel">
        <div className="verification-state verification-state-pending">
          <span><Hourglass size={24} /></span>
          <div>
            <strong>Verification under review</strong>
            <p>We received your {latest ? documentTypeLabels[latest.document_type].toLowerCase() : 'document'} and face photo. An administrator will review them shortly — you'll see the result here.</p>
            {latest && <small>Submitted {new Date(latest.created_at).toLocaleString()}</small>}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard-panel dashboard-page-panel">
      {loadError && <p className="dashboard-form-notice" role="alert">{loadError}</p>}
      {status === 'rejected' && (
        <div className="verification-state verification-state-rejected">
          <span><XCircle size={24} /></span>
          <div>
            <strong>Your previous verification was not approved</strong>
            <p>{latest?.admin_note || 'Please submit clear, current documents and a new face photo.'}</p>
          </div>
        </div>
      )}
      <VerificationForm userId={userId} onSubmitted={onSubmitted} />
    </section>
  )
}

function VerificationForm({ userId, onSubmitted }: { userId: string; onSubmitted: () => Promise<void> }) {
  const [documentType, setDocumentType] = useState<VerificationDocumentType>('id_card')
  const [selfie, setSelfie] = useState<Blob | null>(null)
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const needsBack = documentType !== 'passport'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')

    const data = new FormData(event.currentTarget)
    const pick = (name: string) => {
      const value = data.get(name)
      return value instanceof File && value.size > 0 ? value : null
    }
    const front = pick('documentFront')
    const back = needsBack ? pick('documentBack') : null

    const client = getSupabase()
    const uploaded: string[] = []
    setIsSubmitting(true)
    try {
      if (!front) throw new Error('Upload a photo or scan of your document.')
      validateDocument(front, 'The document front')
      validateDocument(back, 'The document back')
      if (!selfie) throw new Error('Take a live face photo with your camera before submitting.')

      const folder = `${userId}/${crypto.randomUUID()}`
      const upload = async (path: string, file: Blob) => {
        const { error } = await client.storage.from(bucket).upload(path, file, { contentType: file.type, cacheControl: '0', upsert: false })
        if (error) throw error
        uploaded.push(path)
        return path
      }

      const frontPath = await upload(`${folder}/document-front.${extensionFor(front)}`, front)
      const backPath = back ? await upload(`${folder}/document-back.${extensionFor(back)}`, back) : null
      const selfiePath = await upload(`${folder}/selfie.jpg`, selfie)

      const { error: insertError } = await client.from('identity_verifications').insert({
        user_id: userId,
        document_type: documentType,
        document_storage_path: frontPath,
        document_file_name: front.name.slice(0, 255) || 'document',
        document_back_storage_path: backPath,
        document_back_file_name: back ? back.name.slice(0, 255) || 'document-back' : null,
        selfie_storage_path: selfiePath,
        selfie_file_name: 'selfie.jpg',
      })
      if (insertError) throw insertError
    } catch (error) {
      if (uploaded.length > 0) await client.storage.from(bucket).remove(uploaded)
      setNotice(error instanceof Error ? error.message : 'Unable to submit your verification. Please try again.')
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    await onSubmitted()
  }

  return (
    <>
      <div className="dashboard-panel-heading">
        <div>
          <h2>Verify your identity</h2>
          <p>Before you can start a claim or submit other requests, we need a government-issued ID and a live photo of your face.</p>
        </div>
      </div>
      <form className="dashboard-request-form verification-form" onSubmit={handleSubmit}>
        <fieldset className="verification-doc-types">
          <legend>1. Choose your document</legend>
          {documentTypes.map((type) => (
            <label key={type} className={documentType === type ? 'is-selected' : ''}>
              <input type="radio" name="documentType" value={type} checked={documentType === type} onChange={() => setDocumentType(type)} />
              {documentTypeLabels[type]}
            </label>
          ))}
        </fieldset>

        <div className="verification-step-title">2. Upload your {documentTypeLabels[documentType].toLowerCase()}</div>
        <div className={needsBack ? 'dashboard-form-row' : ''}>
          <label className="case-document-field">
            <span>{documentType === 'passport' ? 'Passport photo page' : 'Front side'}</span>
            <span className="case-file-input"><Upload size={16} /><span>PDF, JPG, or PNG (max 10 MB)</span><input name="documentFront" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required /></span>
          </label>
          {needsBack && (
            <label className="case-document-field">
              <span>Back side (recommended)</span>
              <span className="case-file-input"><Upload size={16} /><span>PDF, JPG, or PNG (max 10 MB)</span><input name="documentBack" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" /></span>
            </label>
          )}
        </div>
        <p className="dashboard-muted-note">Make sure all four corners are visible and the text and photo are readable, with no glare.</p>

        <div className="verification-step-title">3. Facial verification</div>
        <SelfieCapture selfie={selfie} onChange={setSelfie} />

        <button className="dashboard-primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Submit for verification'} <ArrowRight size={15} />
        </button>
        <p className="dashboard-muted-note"><ShieldCheck size={13} /> Your documents are stored privately and are only visible to you and authorized administrators.</p>
        {notice && <p className="dashboard-form-notice" role="alert">{notice}</p>}
      </form>
    </>
  )
}

function SelfieCapture({ selfie, onChange }: { selfie: Blob | null; onChange: (blob: Blob | null) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setIsCameraOn(false)
  }

  useEffect(() => stopCamera, [])

  useEffect(() => {
    const video = videoRef.current
    if (!isCameraOn || !video || !streamRef.current) return
    video.srcObject = streamRef.current
    void video.play()
  }, [isCameraOn])

  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  async function startCamera() {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Your browser does not support camera access. Please use an up-to-date browser on a device with a camera.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      streamRef.current = stream
      onChange(null)
      setPreviewUrl('')
      setIsCameraOn(true)
    } catch {
      setError('We could not access your camera. Allow camera permission in your browser settings and try again.')
    }
  }

  function capture() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) return
    context.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Unable to capture the photo. Please try again.')
        return
      }
      onChange(blob)
      setPreviewUrl(URL.createObjectURL(blob))
      stopCamera()
    }, 'image/jpeg', 0.9)
  }

  return (
    <div className="selfie-capture">
      <div className="selfie-frame">
        {isCameraOn ? (
          <>
            <video ref={videoRef} playsInline muted />
            <span className="selfie-guide" aria-hidden="true" />
          </>
        ) : previewUrl ? (
          <img src={previewUrl} alt="Your captured face photo" />
        ) : (
          <div className="selfie-placeholder"><Camera size={28} /><span>Camera preview</span></div>
        )}
      </div>
      <div className="selfie-actions">
        <p>Take a live photo in good light. Face the camera directly, remove sunglasses or hats, and keep your whole face inside the oval. We compare it to the photo on your document.</p>
        {isCameraOn ? (
          <div className="selfie-buttons">
            <button className="dashboard-primary-button" type="button" onClick={capture}><Camera size={15} /> Capture photo</button>
            <button className="dashboard-outline-button" type="button" onClick={stopCamera}>Cancel</button>
          </div>
        ) : (
          <button className="dashboard-outline-button" type="button" onClick={() => void startCamera()}>
            {selfie ? <><RotateCcw size={15} /> Retake photo</> : <><Camera size={15} /> Start camera</>}
          </button>
        )}
        {selfie && !isCameraOn && <small className="selfie-ok"><CheckCircle2 size={13} /> Face photo captured</small>}
        {error && <p className="dashboard-form-notice" role="alert">{error}</p>}
      </div>
    </div>
  )
}
