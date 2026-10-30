import { useQuery } from '@tanstack/react-query'

import { lotQueryOptions } from '../api/lots-api'

export function useLot(id: string) {
  return useQuery(lotQueryOptions(id))
}
