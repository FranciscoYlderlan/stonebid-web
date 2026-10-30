import { queryOptions } from '@tanstack/react-query'

import { apiClient, isApiError } from '@/lib/api-client'

import { receiptResponseSchema } from '../schemas/receipt-schemas'
import type { Receipt } from '../types/receipt-types'

export const receiptsKeys = {
  all: ['receipts'] as const,
  detail: (publicId: string) => [...receiptsKeys.all, publicId] as const,
}

/** Comprovante público (RF-51, RF-52): sem login; o selado não muda depois de emitido. */
export const receiptQueryOptions = (publicId: string) =>
  queryOptions({
    queryKey: receiptsKeys.detail(publicId),
    queryFn: async ({ signal }): Promise<Receipt> =>
      receiptResponseSchema.parse(
        await apiClient.get<unknown>(
          `/receipts/${encodeURIComponent(publicId)}`,
          { signal },
        ),
      ).receipt,
    staleTime: Infinity,
    // Link inexistente ou adulterado: 404 já, sem novas tentativas (nem ao montar a tela
    // depois do prefetch do loader). "Tentar de novo" continua disponível nas outras falhas.
    retryOnMount: false,
    retry: (failureCount, error) =>
      !(isApiError(error) && error.status < 500) && failureCount < 2,
  })
