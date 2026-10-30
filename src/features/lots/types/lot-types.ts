import type { z } from 'zod'

import type {
  auctioneerLotsResponseSchema,
  catalogItemSchema,
  createLotFormSchema,
  itemAttributesSchema,
  itemAuctionSchema,
  lotResponseSchema,
  lotSchema,
  lotStatusSchema,
  showcaseResponseSchema,
} from '../schemas/lot-schemas'

export type LotStatus = z.infer<typeof lotStatusSchema>
export type Lot = z.infer<typeof lotSchema>
export type ItemAttributes = z.infer<typeof itemAttributesSchema>
export type CatalogItem = z.infer<typeof catalogItemSchema>
export type ItemAuction = z.infer<typeof itemAuctionSchema>

/** Toda resposta com `serverTime` ganha o deslocamento do relógio, medido na chegada. */
type WithClock<T> = Omit<T, 'serverTime'> & { clockOffsetMs: number }

export type Showcase = WithClock<z.infer<typeof showcaseResponseSchema>>
export type LotDetail = WithClock<z.infer<typeof lotResponseSchema>>
export type AuctioneerLots = WithClock<
  z.infer<typeof auctioneerLotsResponseSchema>
>

export type CreateLotFormOutput = z.output<
  ReturnType<typeof createLotFormSchema>
>

/** Corpo do `POST /lots`. */
export type CreateLotInput = {
  externalId: string
  startingBidCents: number
  minIncrementCents: number
  startsAt: string
  endsAt: string
}
