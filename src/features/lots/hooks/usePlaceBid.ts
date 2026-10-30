import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isApiError } from '@/lib/api-client'
import { syncWalletCache } from '@/lib/wallet-cache'

import { lotsKeys, placeBidRequest } from '../api/lots-api'
import type { LotDetail } from '../types/lot-types'

export function usePlaceBid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: placeBidRequest,
    onSuccess: async ({ lot, wallet }) => {
      // O lote novo (lance atual, mínimo, líder) e o saldo vêm na resposta; o resto recarrega.
      queryClient.setQueryData<LotDetail>(lotsKeys.detail(lot.id), (old) =>
        old ? { ...old, lot } : old,
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: lotsKeys.all }),
        syncWalletCache(queryClient, wallet),
      ])
    },
    onError: (error, { lotId }) => {
      // Recusa da API (outro lance chegou antes, lote mudou de estado): a sala recarrega.
      if (isApiError(error) && error.status >= 400 && error.status < 500) {
        void queryClient.invalidateQueries({ queryKey: lotsKeys.detail(lotId) })
        void queryClient.invalidateQueries({ queryKey: lotsKeys.bids(lotId) })
      }
    },
  })
}
