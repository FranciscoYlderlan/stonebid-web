import { useQuery } from '@tanstack/react-query'

import { auctioneerLotsQueryOptions } from '../api/lots-api'

export function useAuctioneerLots() {
  return useQuery(auctioneerLotsQueryOptions())
}
