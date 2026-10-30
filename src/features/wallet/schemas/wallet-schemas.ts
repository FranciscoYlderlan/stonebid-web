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

/**
 * Valor em reais no formato pt-BR, sem ambiguidade: dígitos, "." de milhar opcional em
 * grupos de 3 e "," com 1 ou 2 casas ("100", "100,5", "1.234,56"). Recusa "1,234",
 * "1,2,3", "0,001" e "1234.56", que antes viravam outro valor sem aviso.
 */
export const BRL_AMOUNT_PATTERN = /^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/

export const INVALID_AMOUNT_MESSAGE = 'Valor inválido. Use o formato 100,00.'

/** Depósito em reais → centavos: maior que zero e até o teto da carteira (RF-41). */
export function createDepositFormSchema(depositLimitCents: number) {
  return z.object({
    amount: z
      .string()
      .trim()
      .min(1, 'Informe o valor do depósito.')
      .regex(BRL_AMOUNT_PATTERN, INVALID_AMOUNT_MESSAGE)
      .transform(parseReaisToCents)
      .pipe(
        z
          .number(INVALID_AMOUNT_MESSAGE)
          .int()
          .positive('O depósito precisa ser maior que zero.')
          .max(
            depositLimitCents,
            `O depósito máximo é ${formatCents(depositLimitCents)}.`,
          ),
      ),
  })
}
