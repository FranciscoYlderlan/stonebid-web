import type { z } from 'zod'

import type {
  auctioneerLotsResponseSchema,
  catalogItemSchema,
  createLotFormSchema,
  itemAttributesSchema,
  itemAuctionSchema,
  lotResponseSchema,
  lotResultSchema,
  lotSchema,
  lotStatusSchema,
  lotViewerSchema,
  showcaseResponseSchema,
} from '../schemas/lot-schemas'
import type {
  bidHistoryItemSchema,
  bidSchema,
  placeBidResponseSchema,
} from '../schemas/bid-schemas'

export type LotStatus = z.infer<typeof lotStatusSchema>
export type Lot = z.infer<typeof lotSchema>
export type LotResult = z.infer<typeof lotResultSchema>
export type LotViewer = z.infer<typeof lotViewerSchema>
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

export type Bid = z.infer<typeof bidSchema>
export type BidHistoryItem = z.infer<typeof bidHistoryItemSchema>
export type PlaceBidResponse = z.infer<typeof placeBidResponseSchema>

/** Corpo e cabeçalho do `POST /lots/:id/bids`. */
export type PlaceBidInput = {
  lotId: string
  amountCents: number
  /** Uma chave por lance, reusada nas novas tentativas do mesmo valor (RN-18). */
  idempotencyKey: string
}
