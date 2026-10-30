import { useQuery } from '@tanstack/react-query'

import { showcaseQueryOptions } from '../api/lots-api'

export function useShowcase() {
  return useQuery(showcaseQueryOptions())
}
