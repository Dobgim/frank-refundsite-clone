import type { CaseRequestStatus, CaseRequestType, ProfileVerificationStatus, VerificationDocumentType } from './database.types'

export const requestTypeLabels: Record<CaseRequestType, string> = {
  claim: 'Claim',
  verification: 'Verification',
  loan: 'Loan application',
  withdrawal: 'Withdrawal request',
  support: 'Customer service',
}

export const requestStatusLabels: Record<CaseRequestStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  needs_information: 'Needs information',
  approved: 'Approved for review',
  declined: 'Declined',
  resolved: 'Resolved',
}

export const documentTypeLabels: Record<VerificationDocumentType, string> = {
  id_card: 'National ID card',
  passport: 'Passport',
  license: "Driver's license",
}

export const verificationStatusLabels: Record<ProfileVerificationStatus, string> = {
  unverified: 'Not verified',
  pending: 'Pending review',
  approved: 'Verified',
  rejected: 'Rejected',
}

/** Maps a verification status onto the existing case-status pill colours. */
export const verificationStatusClass: Record<ProfileVerificationStatus, string> = {
  unverified: 'status-under-review',
  pending: 'status-submitted',
  approved: 'status-approved',
  rejected: 'status-declined',
}
