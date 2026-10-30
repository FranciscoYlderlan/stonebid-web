import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { z } from 'zod'

import { apiClient, isApiError } from '@/lib/api-client'
import { clockOffsetFrom } from '@/lib/time'

import {
  auctioneerLotsResponseSchema,
  itemSearchResponseSchema,
  lotResponseSchema,
  lotSchema,
  showcaseResponseSchema,
} from '../schemas/lot-schemas'
import type {
  AuctioneerLots,
  CreateLotInput,
  Lot,
  LotDetail,
  Showcase,
} from '../types/lot-types'

export const lotsKeys = {
  all: ['lots'] as const,
  showcase: () => [...lotsKeys.all, 'showcase'] as const,
  detail: (id: string) => [...lotsKeys.all, 'detail', id] as const,
  mine: () => [...lotsKeys.all, 'mine'] as const,
  itemSearchAll: () => ['items', 'search'] as const,
  itemSearch: (q: string, page: number) =>
    [...lotsKeys.itemSearchAll(), q, page] as const,
}

/** GET com `serverTime`: valida e troca a hora do servidor pelo deslocamento do relógio local. */
async function getWithClock<
  TSchema extends z.ZodObject<{ serverTime: z.ZodString }>,
>(path: string, schema: TSchema, signal?: AbortSignal) {
  const data = await apiClient.get<unknown>(path, { signal })
  const receivedAt = Date.now()
  const { serverTime, ...rest } = schema.parse(data) as z.output<TSchema>
  return {
    ...rest,
    clockOffsetMs: clockOffsetFrom(serverTime as string, receivedAt),
  }
}

/** A vitrine se atualiza sozinha: os lotes mudam de estado com o tempo. */
const SHOWCASE_REFETCH_MS = 15_000

export const showcaseQueryOptions = () =>
  queryOptions({
    queryKey: lotsKeys.showcase(),
    queryFn: ({ signal }): Promise<Showcase> =>
      getWithClock('/lots', showcaseResponseSchema, signal),
    refetchInterval: SHOWCASE_REFETCH_MS,
  })

export const lotQueryOptions = (id: string) =>
  queryOptions({
    queryKey: lotsKeys.detail(id),
    queryFn: ({ signal }): Promise<LotDetail> =>
      getWithClock(
        `/lots/${encodeURIComponent(id)}`,
        lotResponseSchema,
        signal,
      ),
  })

export const auctioneerLotsQueryOptions = () =>
  queryOptions({
    queryKey: lotsKeys.mine(),
    queryFn: ({ signal }): Promise<AuctioneerLots> =>
      getWithClock('/auctioneer/lots', auctioneerLotsResponseSchema, signal),
  })

export const itemSearchQueryOptions = (q: string, page: number) =>
  queryOptions({
    queryKey: lotsKeys.itemSearch(q, page),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ q, page: String(page) })
      const data = await apiClient.get<unknown>(`/items/search?${params}`, {
        signal,
      })
      return itemSearchResponseSchema.parse(data)
    },
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    // API externa fora do ar: mostrar a mensagem já, sem novas tentativas.
    retry: (failureCount, error) =>
      !isApiError(error, 'EXTERNAL_API_UNAVAILABLE') &&
      !(isApiError(error) && error.status < 500) &&
      failureCount < 1,
  })

export async function createLotRequest(input: CreateLotInput): Promise<Lot> {
  return lotSchema.parse(await apiClient.post<unknown>('/lots', input))
}

export async function cancelLotRequest(id: string): Promise<Lot> {
  return lotSchema.parse(
    await apiClient.post<unknown>(`/lots/${encodeURIComponent(id)}/cancel`),
  )
}
