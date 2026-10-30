import { queryOptions } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'

import { myBidsResponseSchema } from '../schemas/my-bids-schemas'
import type { MyBid } from '../types/my-bids-types'

export const myBidsKeys = {
  all: ['my-bids'] as const,
}

/** A posição muda com os lances dos outros e com a liquidação: a lista se atualiza sozinha. */
const MY_BIDS_REFETCH_MS = 15_000

/** Lotes em que o licitante deu lance, mais recentes primeiro (dado pessoal: só na área logada). */
export const myBidsQueryOptions = () =>
  queryOptions({
    queryKey: myBidsKeys.all,
    queryFn: async ({ signal }): Promise<MyBid[]> =>
      myBidsResponseSchema.parse(
        await apiClient.get<unknown>('/me/bids', { signal }),
      ).items,
    refetchInterval: MY_BIDS_REFETCH_MS,
  })
