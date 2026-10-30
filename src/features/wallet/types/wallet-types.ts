import type { z } from 'zod'

import type {
  depositResponseSchema,
  movementSchema,
  movementTypeSchema,
  walletSchema,
} from '../schemas/wallet-schemas'

export type Wallet = z.infer<typeof walletSchema>
export type Movement = z.infer<typeof movementSchema>
export type MovementType = z.infer<typeof movementTypeSchema>
export type DepositResponse = z.infer<typeof depositResponseSchema>
