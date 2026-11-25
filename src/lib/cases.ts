import type { CaseRequestStatus, CaseRequestType } from './database.types'

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
