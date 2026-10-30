import { z } from 'zod'

import { parseReaisToCents } from '@/lib/money'

export const lotStatusSchema = z.enum([
  'SCHEDULED',
  'LIVE',
  'ENDED',
  'CANCELED',
])

export const LOT_STATUS_LABELS: Record<
  z.infer<typeof lotStatusSchema>,
  string
> = {
  LIVE: 'Ao vivo',
  SCHEDULED: 'Agendado',
  ENDED: 'Encerrado',
  CANCELED: 'Cancelado',
}

/** Resultado de um lote liquidado: arrematado ou encerrado sem lances. */
export const lotResultSchema = z.enum(['SOLD', 'NO_WINNER'])

export const itemAttributesSchema = z.object({
  artist: z.string().nullish(),
  date: z.string().nullish(),
  medium: z.string().nullish(),
  dimensions: z.string().nullish(),
  placeOfOrigin: z.string().nullish(),
})

export const lotSchema = z.object({
  id: z.string(),
  title: z.string(),
  attributes: itemAttributesSchema.catch({}),
  imageUrl: z.string().nullish(),
  startingBidCents: z.number().int(),
  minIncrementCents: z.number().int(),
  /** Lance que lidera; `null` sem lance. */
  currentBidCents: z.number().int().nullable(),
  /** Menor lance aceito agora: o inicial sem lance, ou o atual + incremento. */
  minNextBidCents: z.number().int(),
  /** Pseudônimo de quem lidera; `null` sem lance. */
  leaderPseudonym: z.string().nullable(),
  startsAt: z.string(),
  originalEndsAt: z.string(),
  endsAt: z.string(),
  status: lotStatusSchema,
  canceledAt: z.string().nullish(),
  /** Resultado da liquidação (lote ENDED); `null` até liquidar. */
  result: lotResultSchema.nullish(),
  settledAt: z.string().nullish(),
  /** Comprovante público do arremate; só com `result` SOLD. */
  receiptPublicId: z.string().nullish(),
  /** Motivo que o leiloeiro deu ao cancelar (3 a 280 caracteres). */
  cancelReason: z.string().nullish(),
})

export const showcaseResponseSchema = z.object({
  serverTime: z.string(),
  live: z.array(lotSchema),
  scheduled: z.array(lotSchema),
  ended: z.array(lotSchema),
})

export const lotResponseSchema = z.object({
  serverTime: z.string(),
  lot: lotSchema,
})

export const auctioneerLotsResponseSchema = z.object({
  serverTime: z.string(),
  items: z.array(lotSchema),
  /** Soma dos créditos de liquidação do leiloeiro (lotes arrematados). */
  totalReceivedCents: z.number().int(),
})

/** Limites do motivo do cancelamento, iguais aos do `POST /lots/:id/cancel`. */
export const CANCEL_REASON_MIN = 3
export const CANCEL_REASON_MAX = 280

/** Motivo do cancelamento (corpo `{ reason }`), validado no cliente como no servidor. */
export const cancelLotFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Informe o motivo do cancelamento.')
    .min(
      CANCEL_REASON_MIN,
      `O motivo precisa ter pelo menos ${CANCEL_REASON_MIN} caracteres.`,
    )
    .max(
      CANCEL_REASON_MAX,
      `O motivo pode ter no máximo ${CANCEL_REASON_MAX} caracteres.`,
    ),
})

/** RN-19: situação da obra no Stonebid. Agendado e ao vivo = "Em leilão"; arrematado = "Vendido". */
export const itemAuctionStatusSchema = z.enum(['SCHEDULED', 'LIVE', 'SOLD'])

export const ITEM_AUCTION_LABELS: Record<
  z.infer<typeof itemAuctionStatusSchema>,
  string
> = {
  SCHEDULED: 'Em leilão',
  LIVE: 'Em leilão',
  SOLD: 'Vendido',
}

/** Por que a obra não pode ganhar lote novo (RN-19): lido junto do botão desabilitado. */
export const ITEM_AUCTION_REASONS: Record<
  z.infer<typeof itemAuctionStatusSchema>,
  string
> = {
  SCHEDULED:
    'Esta obra já tem um lote agendado. Uma obra só pode estar em um lote por vez.',
  LIVE: 'Esta obra já está em leilão em um lote ao vivo. Uma obra só pode estar em um lote por vez.',
  SOLD: 'Esta obra já foi vendida em leilão e não pode ser leiloada de novo.',
}

export const itemAuctionSchema = z.object({
  status: itemAuctionStatusSchema,
  lotId: z.string(),
})

export const catalogItemSchema = z.object({
  externalId: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  /** Relativo à API (`/items/images/{imageId}/thumbnail`): o IIIF da AIC barra o navegador. */
  imageUrl: z.string().nullish(),
  attributes: itemAttributesSchema.catch({}),
  /**
   * Lote que bloqueia a obra (RN-19). Ausente, `null` (banco fora) ou fora do contrato = obra
   * livre: a API recusa com 409 na criação se não for.
   */
  auction: itemAuctionSchema
    .nullish()
    .transform((auction) => auction ?? null)
    .catch(null),
})

export const itemSearchResponseSchema = z.object({
  items: z.array(catalogItemSchema),
  page: z.number().int(),
})

const reaisField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Informe ${label}.`)
    .transform(parseReaisToCents)
    .pipe(
      z
        .number(`Informe ${label} em reais, como 150,00.`)
        .int()
        .positive(
          `${label[0]?.toUpperCase()}${label.slice(1)} precisa ser maior que zero.`,
        ),
    )

const dateTimeField = (label: string) =>
  z
    .string()
    .min(1, `Informe ${label}.`)
    .transform((value) => new Date(value))
    .pipe(z.date(`Informe ${label} válido.`))

/** Duração mínima de um lote: fim ≥ início + 5 min (regra do servidor). */
export const MIN_LOT_DURATION_MS = 5 * 60 * 1000

/**
 * Formulário de lote: reais e `datetime-local` → corpo do `POST /lots` (centavos e ISO UTC).
 * `getNowMs` dá a hora do servidor no momento da validação, para "início não no passado"
 * não depender do relógio local.
 */
export function createLotFormSchema(getNowMs: () => number) {
  return z
    .object({
      startingBid: reaisField('o lance inicial'),
      minIncrement: reaisField('o incremento mínimo'),
      startsAt: dateTimeField('o início'),
      endsAt: dateTimeField('o fim'),
    })
    .superRefine(({ startsAt, endsAt }, ctx) => {
      if (startsAt.getTime() < getNowMs()) {
        ctx.addIssue({
          code: 'custom',
          path: ['startsAt'],
          message: 'O início não pode estar no passado.',
        })
      }
      if (endsAt.getTime() < startsAt.getTime() + MIN_LOT_DURATION_MS) {
        ctx.addIssue({
          code: 'custom',
          path: ['endsAt'],
          message: 'O fim precisa ser pelo menos 5 minutos depois do início.',
        })
      }
    })
}

/** Código do 409 da criação quando a obra já tem lote agendado, ao vivo ou arrematado (RN-19). */
export const ITEM_ALREADY_AUCTIONED = 'ITEM_ALREADY_AUCTIONED'

/** `details` do 409 `ITEM_ALREADY_AUCTIONED`: `null` se vier fora do contrato. */
export const itemAlreadyAuctionedDetailsSchema = itemAuctionSchema
  .nullable()
  .catch(null)
