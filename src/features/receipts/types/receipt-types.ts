import type { z } from 'zod'

import type { receiptSchema } from '../schemas/receipt-schemas'

export type Receipt = z.infer<typeof receiptSchema>
