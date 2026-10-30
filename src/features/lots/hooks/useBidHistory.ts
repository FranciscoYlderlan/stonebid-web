import { useQuery } from '@tanstack/react-query'

import { bidHistoryQueryOptions } from '../api/lots-api'

export function useBidHistory(id: string) {
  return useQuery(bidHistoryQueryOptions(id))
}
