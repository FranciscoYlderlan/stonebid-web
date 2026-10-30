import { useQuery } from '@tanstack/react-query'

import { lotQueryOptions } from '../api/lots-api'

type RefetchInterval = ReturnType<typeof lotQueryOptions>['refetchInterval']

/** `refetchInterval`: só a sala liga, com o plano B do stream (`useLotStream`). */
export function useLot(id: string, refetchInterval: RefetchInterval = false) {
  return useQuery({ ...lotQueryOptions(id), refetchInterval })
}
