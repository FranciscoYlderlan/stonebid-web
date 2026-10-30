import { z } from 'zod'

/** Comprovante público do arremate, como o `GET /receipts/:publicId` devolve. */
export const receiptSchema = z.object({
  publicId: z.string(),
  lotId: z.string(),
  title: z.string(),
  /** Relativo à API (`/lots/:id/image`): o comprovante não chama a API externa. */
  imageUrl: z.string().nullish(),
  finalAmountCents: z.number().int(),
  settledAt: z.string(),
  winnerPseudonym: z.string(),
  finalHash: z.string(),
  /** Caminho da auditoria do lote no web (`/lots/:lotId/audit`). */
  auditPath: z.string(),
})

export const receiptResponseSchema = z.object({ receipt: receiptSchema })

/** Código do 404 de comprovante inexistente ou adulterado. */
export const RECEIPT_NOT_FOUND = 'RECEIPT_NOT_FOUND'
