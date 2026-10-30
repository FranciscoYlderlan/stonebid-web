import { useQuery } from '@tanstack/react-query'

import { walletQueryOptions } from '../api/wallet-api'

export function useWallet() {
  return useQuery(walletQueryOptions())
}
