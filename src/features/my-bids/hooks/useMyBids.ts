import { useQuery } from '@tanstack/react-query'

import { myBidsQueryOptions } from '../api/my-bids-api'

export function useMyBids() {
  return useQuery(myBidsQueryOptions())
}
