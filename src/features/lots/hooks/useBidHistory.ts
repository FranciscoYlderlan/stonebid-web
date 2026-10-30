import { useQuery } from '@tanstack/react-query'

import { bidHistoryQueryOptions } from '../api/lots-api'

/** `refetchInterval`: só a sala liga, com o plano B do stream (`useLotStream`). */
export function useBidHistory(
  id: string,
  refetchInterval: number | false = false,
) {
  return useQuery({ ...bidHistoryQueryOptions(id), refetchInterval })
}
