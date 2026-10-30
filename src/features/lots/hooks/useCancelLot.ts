import { useMutation, useQueryClient } from '@tanstack/react-query'

import { cancelLotRequest, lotsKeys } from '../api/lots-api'

export function useCancelLot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelLotRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: lotsKeys.all }),
  })
}
