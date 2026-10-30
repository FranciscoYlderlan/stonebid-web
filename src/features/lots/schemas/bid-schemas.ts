import { z } from 'zod'

import { reaisAmountField } from '@/lib/money'
import { walletSchema } from '@/lib/wallet-cache'

import { lotSchema } from './lot-schemas'

/** Lance gravado, como volta do `POST /lots/:id/bids`. */
export const bidSchema = z.object({
  seq: z.number().int(),
  lotId: z.string(),
  amountCents: z.number().int(),
  pseudonym: z.string(),
  createdAt: z.string(),
})

/** `POST /lots/:id/bids`: 201 lance novo, 200 repetição da mesma `Idempotency-Key`. */
export const placeBidResponseSchema = z.object({
  bid: bidSchema,
  lot: lotSchema,
  wallet: walletSchema,
})

/** Item do histórico público (`GET /lots/:id/bids`): sem nome nem e-mail de ninguém. */
export const bidHistoryItemSchema = z.object({
  seq: z.number().int(),
  amountCents: z.number().int(),
  pseudonym: z.string(),
  createdAt: z.string(),
})

/** Histórico em ordem de `seq` decrescente (o lance mais novo primeiro). */
export const bidHistoryResponseSchema = z.object({
  items: z.array(bidHistoryItemSchema),
})

/** Formulário do lance: reais → centavos. O mínimo quem confere é o servidor (RF-70). */
export const bidFormSchema = z.object({
  amount: reaisAmountField(
    'Informe o valor do lance.',
    'O lance precisa ser maior que zero.',
  ),
})

/** Código do 422 de lance abaixo do mínimo. */
export const BID_BELOW_MINIMUM = 'BID_BELOW_MINIMUM'

/** `details` do 422 `BID_BELOW_MINIMUM`: `null` se vier fora do contrato. */
export const bidBelowMinimumDetailsSchema = z
  .object({ minAmountCents: z.number().int() })
  .nullable()
  .catch(null)
