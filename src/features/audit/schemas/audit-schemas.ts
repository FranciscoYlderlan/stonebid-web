import { z } from 'zod'

import { lotSchema } from '@/features/lots'

/** Veredito da cadeia de lances, recalculado pela API a cada consulta (RF-60). */
export const auditVerdictSchema = z.enum(['INTACT', 'TAMPERED'])

/** Por que a cadeia não confere: o primeiro problema encontrado na verificação. */
export const auditReasonSchema = z.enum([
  'GAP',
  'CONTENT_CHANGED',
  'BAD_SEAL',
  'BROKEN_LINK',
  'HEAD_MISMATCH',
  'RECEIPT_MISMATCH',
  'SETTLEMENT_MISMATCH',
])

export const AUDIT_REASON_LABELS: Record<
  z.infer<typeof auditReasonSchema>,
  string
> = {
  GAP: 'Numeração com buraco: lance removido',
  CONTENT_CHANGED: 'Conteúdo do lance editado',
  BAD_SEAL: 'Selo do lance inválido',
  BROKEN_LINK: 'Lance inserido ou removido (encadeamento quebrado)',
  HEAD_MISMATCH: 'Último lance apagado ou cabeça da cadeia alterada',
  RECEIPT_MISMATCH: 'Comprovante não confere com o histórico',
  SETTLEMENT_MISMATCH: 'Liquidação não confere com o extrato',
}

/** Lance da cadeia, com o hash anterior e o próprio (SHA-256 em hex). */
export const auditBidSchema = z.object({
  seq: z.number().int(),
  pseudonym: z.string(),
  amountCents: z.number().int(),
  createdAt: z.string(),
  prevHash: z.string(),
  hash: z.string(),
})

export const auditInconsistencySchema = z.object({
  /** `null` quando o problema não é de um lance (ex.: comprovante ou liquidação). */
  seq: z.number().int().nullable(),
  reason: auditReasonSchema,
})

/** Corpo do `GET /lots/:id/audit` (público, `no-store`). */
export const auditResponseSchema = z.object({
  lot: lotSchema,
  bids: z.array(auditBidSchema),
  verdict: auditVerdictSchema,
  firstInconsistency: auditInconsistencySchema.nullable(),
  checkedAt: z.string(),
})

/** Código do 404 de lote inexistente. */
export const LOT_NOT_FOUND = 'LOT_NOT_FOUND'
