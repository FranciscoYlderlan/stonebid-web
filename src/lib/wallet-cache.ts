import type { QueryClient } from '@tanstack/react-query'
import { z } from 'zod'

/**
 * Carteira no cache do TanStack Query. Fica em `lib/` porque mais de uma feature recebe o
 * saldo novo na resposta (depósito na `wallet`, lance na `lots`) e features não importam
 * umas das outras.
 */
export const walletKeys = {
  all: ['wallet'] as const,
  balance: () => [...walletKeys.all, 'balance'] as const,
  movements: () => [...walletKeys.all, 'movements'] as const,
}

/** `WalletDto` da API (`GET /wallet`), campo a campo. */
export const walletSchema = z.object({
  totalCents: z.number().int(),
  committedCents: z.number().int(),
  availableCents: z.number().int(),
  depositLimitCents: z.number().int(),
})

/** Saldo novo que veio numa resposta: grava no cache e recarrega o extrato. */
export async function syncWalletCache(
  queryClient: QueryClient,
  wallet: z.infer<typeof walletSchema>,
) {
  queryClient.setQueryData(walletKeys.balance(), wallet)
  await queryClient.invalidateQueries({ queryKey: walletKeys.movements() })
}
