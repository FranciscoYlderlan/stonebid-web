import { useQuery } from '@tanstack/react-query'

import { itemSearchQueryOptions } from '../api/lots-api'

export function useItemSearch(q: string, page: number) {
  return useQuery(itemSearchQueryOptions(q, page))
}
