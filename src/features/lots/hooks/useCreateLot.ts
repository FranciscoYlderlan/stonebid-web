import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createLotRequest, lotsKeys } from '../api/lots-api'

export function useCreateLot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createLotRequest,
    // Meus lotes e a vitrine mudam juntos.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: lotsKeys.all }),
  })
}
