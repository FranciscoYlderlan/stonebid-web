import { useMutation, useQueryClient } from '@tanstack/react-query'

import { syncWalletCache } from '@/lib/wallet-cache'

import { depositRequest } from '../api/wallet-api'

export function useDeposit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: depositRequest,
    // O saldo novo vem na resposta; o extrato é recarregado.
    onSuccess: ({ wallet }) => syncWalletCache(queryClient, wallet),
  })
}
