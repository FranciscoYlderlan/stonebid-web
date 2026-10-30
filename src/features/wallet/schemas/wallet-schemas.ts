import { z } from 'zod'

import { formatCents, parseReaisToCents } from '@/lib/money'

export const walletSchema = z.object({
  totalCents: z.number().int(),
  committedCents: z.number().int(),
  availableCents: z.number().int(),
  depositLimitCents: z.number().int(),
})

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
    amount: z
      .string()
      .trim()
      .min(1, 'Informe o valor do depósito.')
      .transform(parseReaisToCents)
      .pipe(
        z
          .number('Informe um valor em reais, como 100,00.')
          .int()
          .positive('O depósito precisa ser maior que zero.')
          .max(
            depositLimitCents,
            `O depósito máximo é ${formatCents(depositLimitCents)}.`,
          ),
      ),
  })
}
