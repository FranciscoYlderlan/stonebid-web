import type { z } from 'zod'

import type { bidPositionSchema, myBidSchema } from '../schemas/my-bids-schemas'

export type BidPosition = z.infer<typeof bidPositionSchema>
export type MyBid = z.infer<typeof myBidSchema>
