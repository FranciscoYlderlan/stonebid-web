import { z } from 'zod'

import { formatCents, reaisAmountField } from '@/lib/money'
import { walletSchema } from '@/lib/wallet-cache'

export { walletSchema }

export const movementTypeSchema = z.enum([
  'DEPOSIT',
  'COMMIT',
  'RELEASE',
  'DEBIT',
  'CREDIT',
  'REFUND',
])

export const MOVEMENT_TYPE_LABELS: Record<
  z.infer<typeof movementTypeSchema>,
  string
> = {
  DEPOSIT: 'Depósito',
  COMMIT: 'Comprometimento',
  RELEASE: 'Liberação',
  DEBIT: 'Débito',
  CREDIT: 'Crédito',
  REFUND: 'Estorno',
}

export const movementSchema = z.object({
  id: z.string(),
  type: movementTypeSchema,
  amountCents: z.number().int(),
  lotId: z.string().nullish(),
  createdAt: z.string(),
})

export const movementsResponseSchema = z.object({
  items: z.array(movementSchema),
})

export const depositResponseSchema = z.object({
  movement: movementSchema,
  wallet: walletSchema,
})

/** Depósito em reais → centavos: maior que zero e até o teto da carteira (RF-41). */
export function createDepositFormSchema(depositLimitCents: number) {
  return z.object({
    amount: reaisAmountField(
      'Informe o valor do depósito.',
      'O depósito precisa ser maior que zero.',
    ).pipe(
      z
        .number()
        .max(
          depositLimitCents,
          `O depósito máximo é ${formatCents(depositLimitCents)}.`,
        ),
    ),
  })
}
