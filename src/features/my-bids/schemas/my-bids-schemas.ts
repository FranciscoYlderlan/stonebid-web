import { z } from 'zod'

/** Posição do licitante em cada lote em que deu lance, como o `GET /me/bids` devolve. */
export const bidPositionSchema = z.enum([
  'LEADING',
  'OUTBID',
  'WON',
  'LOST',
  'CANCELED',
])

export const BID_POSITION_LABELS: Record<
  z.infer<typeof bidPositionSchema>,
  string
> = {
  LEADING: 'Liderando',
  OUTBID: 'Superado',
  WON: 'Arrematado',
  LOST: 'Não arrematado',
  CANCELED: 'Cancelado',
}

/**
 * Só os campos do `LotDto` que esta tela usa (o zod descarta o resto). O `LotDto` completo
 * é da feature lots; features não importam umas das outras.
 */
const myBidLotSchema = z.object({
  id: z.string(),
  title: z.string(),
  imageUrl: z.string().nullish(),
  currentBidCents: z.number().int().nullable(),
  endsAt: z.string(),
  cancelReason: z.string().nullish(),
})

export const myBidSchema = z.object({
  lot: myBidLotSchema,
  myMaxBidCents: z.number().int(),
  position: bidPositionSchema,
  receiptPublicId: z.string().nullable(),
})

export const myBidsResponseSchema = z.object({
  serverTime: z.string(),
  items: z.array(myBidSchema),
})
