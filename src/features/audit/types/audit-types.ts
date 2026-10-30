import type { z } from 'zod'

import type {
  auditBidSchema,
  auditInconsistencySchema,
  auditReasonSchema,
  auditResponseSchema,
  auditVerdictSchema,
} from '../schemas/audit-schemas'

export type Audit = z.infer<typeof auditResponseSchema>
export type AuditBid = z.infer<typeof auditBidSchema>
export type AuditVerdict = z.infer<typeof auditVerdictSchema>
export type AuditReason = z.infer<typeof auditReasonSchema>
export type AuditInconsistency = z.infer<typeof auditInconsistencySchema>
