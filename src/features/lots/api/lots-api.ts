import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { z } from 'zod'

import { apiClient, apiUrl, isApiError } from '@/lib/api-client'
import { clockOffsetFrom } from '@/lib/time'

import {
  auctioneerLotsResponseSchema,
  itemSearchResponseSchema,
  lotEventSchema,
  lotResponseSchema,
  lotSchema,
  showcaseResponseSchema,
} from '../schemas/lot-schemas'
import {
  bidHistoryResponseSchema,
  placeBidResponseSchema,
} from '../schemas/bid-schemas'
import type {
  AuctioneerLots,
  BidHistoryItem,
  CreateLotInput,
  Lot,
  LotDetail,
  PlaceBidInput,
  PlaceBidResponse,
  Showcase,
} from '../types/lot-types'

export const lotsKeys = {
  all: ['lots'] as const,
  showcase: () => [...lotsKeys.all, 'showcase'] as const,
  detail: (id: string) => [...lotsKeys.all, 'detail', id] as const,
  bids: (id: string) => [...lotsKeys.all, 'bids', id] as const,
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

/**
 * Plano B do tempo real (AD-04): enquanto o stream SSE da sala estiver fora, o lote e o
 * histórico recarregam a cada 3 s. Com o stream no ar, nada recarrega sozinho.
 */
export const LOT_ROOM_FALLBACK_REFETCH_MS = 3_000

/** Lote e histórico chegam pelo stream (`useLotStream`); quem liga a recarga é a sala. */
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

/** URL do stream público da sala (`GET /lots/:id/events`). */
export const lotEventsUrl = (id: string) =>
  apiUrl(`/lots/${encodeURIComponent(id)}/events`)

/** `data` de um evento do stream → lote com o deslocamento do relógio; `null` fora do contrato. */
export function parseLotEvent(
  data: string,
  receivedAt = Date.now(),
): LotDetail | null {
  let json: unknown
  try {
    json = JSON.parse(data)
  } catch {
    return null
  }
  const parsed = lotEventSchema.safeParse(json)
  if (!parsed.success) return null
  const { serverTime, lot } = parsed.data
  return { lot, clockOffsetMs: clockOffsetFrom(serverTime, receivedAt) }
}

/** Histórico público de lances do lote (pseudônimo, valor e hora), do mais novo ao mais antigo. */
export const bidHistoryQueryOptions = (id: string) =>
  queryOptions({
    queryKey: lotsKeys.bids(id),
    queryFn: async ({ signal }): Promise<BidHistoryItem[]> =>
      bidHistoryResponseSchema.parse(
        await apiClient.get<unknown>(`/lots/${encodeURIComponent(id)}/bids`, {
          signal,
        }),
      ).items,
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

/** Lance (RF-33). A mesma `Idempotency-Key` repetida não grava outro lance (RN-18). */
export async function placeBidRequest({
  lotId,
  amountCents,
  idempotencyKey,
}: PlaceBidInput): Promise<PlaceBidResponse> {
  const data = await apiClient.post<unknown>(
    `/lots/${encodeURIComponent(lotId)}/bids`,
    { amountCents },
    { headers: { 'Idempotency-Key': idempotencyKey } },
  )
  return placeBidResponseSchema.parse(data)
}
