import { useQuery } from '@tanstack/react-query'

import { movementsQueryOptions } from '../api/wallet-api'

export function useWalletMovements() {
  return useQuery(movementsQueryOptions())
}
