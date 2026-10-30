import { useQuery } from '@tanstack/react-query'

import { auditQueryOptions } from '../api/audit-api'

export function useLotAudit(lotId: string) {
  return useQuery(auditQueryOptions(lotId))
}
