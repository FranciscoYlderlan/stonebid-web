import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isApiError } from '@/lib/api-client'

import { createLotRequest, lotsKeys } from '../api/lots-api'
import { ITEM_ALREADY_AUCTIONED } from '../schemas/lot-schemas'

export function useCreateLot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createLotRequest,
    // Meus lotes e a vitrine mudam juntos; na busca, a obra passa a "Em leilão" (RN-19).
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: lotsKeys.all }),
        queryClient.invalidateQueries({ queryKey: lotsKeys.itemSearchAll() }),
      ]),
    // Obra tomada por outro lote entre a busca e o envio: a busca mostra o selo novo.
    onError: (error) => {
      if (isApiError(error, ITEM_ALREADY_AUCTIONED))
        void queryClient.invalidateQueries({
          queryKey: lotsKeys.itemSearchAll(),
        })
    },
  })
}
