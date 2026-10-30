import { queryOptions } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'

import {
  depositResponseSchema,
  movementsResponseSchema,
  walletSchema,
} from '../schemas/wallet-schemas'
import type { DepositResponse } from '../types/wallet-types'

export const walletKeys = {
  all: ['wallet'] as const,
  balance: () => [...walletKeys.all, 'balance'] as const,
  movements: () => [...walletKeys.all, 'movements'] as const,
}

export const walletQueryOptions = () =>
  queryOptions({
    queryKey: walletKeys.balance(),
    queryFn: async ({ signal }) =>
      walletSchema.parse(await apiClient.get<unknown>('/wallet', { signal })),
  })

export const movementsQueryOptions = () =>
  queryOptions({
    queryKey: walletKeys.movements(),
    queryFn: async ({ signal }) =>
      movementsResponseSchema.parse(
        await apiClient.get<unknown>('/wallet/movements', { signal }),
      ).items,
  })

export type DepositInput = {
  amountCents: number
  /** Uma chave por depósito, reusada nas novas tentativas: repetir a mesma chave não deposita de novo (RN-18). */
  idempotencyKey: string
}

export async function depositRequest({
  amountCents,
  idempotencyKey,
}: DepositInput): Promise<DepositResponse> {
  const data = await apiClient.post<unknown>(
    '/wallet/deposits',
    { amountCents },
    { headers: { 'Idempotency-Key': idempotencyKey } },
  )
  return depositResponseSchema.parse(data)
}
