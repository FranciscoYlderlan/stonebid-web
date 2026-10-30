import { useMutation, useQueryClient } from '@tanstack/react-query'

import { depositRequest, walletKeys } from '../api/wallet-api'

export function useDeposit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: depositRequest,
    onSuccess: async ({ wallet }) => {
      // O saldo novo vem na resposta; o extrato é recarregado.
      queryClient.setQueryData(walletKeys.balance(), wallet)
      await queryClient.invalidateQueries({ queryKey: walletKeys.movements() })
    },
  })
}
