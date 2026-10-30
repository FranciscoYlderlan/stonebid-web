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

export const itemAttributesSchema = z.object({
  artist: z.string().nullish(),
  date: z.string().nullish(),
  medium: z.string().nullish(),
  dimensions: z.string().nullish(),
  origin: z.string().nullish(),
})

export const lotSchema = z.object({
  id: z.string(),
  title: z.string(),
  attributes: itemAttributesSchema.catch({}),
  imageUrl: z.string().nullish(),
  startingBidCents: z.number().int(),
  minIncrementCents: z.number().int(),
  currentBidCents: z.number().int().nullable(),
  startsAt: z.string(),
  originalEndsAt: z.string(),
  endsAt: z.string(),
  status: lotStatusSchema,
  canceledAt: z.string().nullish(),
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
})

export const catalogItemSchema = z.object({
  externalId: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  /** Relativo à API (`/items/images/{imageId}/thumbnail`): o IIIF da AIC barra o navegador. */
  imageUrl: z.string().nullish(),
  attributes: itemAttributesSchema.catch({}),
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
