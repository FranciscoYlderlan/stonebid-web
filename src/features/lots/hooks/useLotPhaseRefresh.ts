import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { serverNowMs } from '@/lib/time'

import { lotsKeys } from '../api/lots-api'
import type { LotDetail } from '../types/lot-types'

/** Folga depois da virada, para o servidor já ver o lote no estado novo. */
const MARGIN_MS = 1_000
/** Encerrado e ainda não liquidado: relê a cada 5 s (a leitura liquida na API). */
const AWAITING_SETTLEMENT_MS = 5_000
/** Maior espera aceita pelo `setTimeout` (~24 dias); acima disso, relê antes e reagenda. */
const MAX_TIMEOUT_MS = 2_147_483_647

/**
 * O stream só avisa lance, cancelamento e liquidação; início e fim do lote são pela hora.
 * Na virada (agendado → ao vivo, ao vivo → encerrado) a sala relê o lote uma vez; se o
 * servidor ainda não virou, a resposta nova agenda outra leitura. Ler o lote vencido também
 * dispara a liquidação na API; encerrado sem liquidar relê a cada 5 s até o resultado.
 */
export function useLotPhaseRefresh(
  id: string,
  data: LotDetail | undefined,
  dataUpdatedAt: number,
) {
  const queryClient = useQueryClient()
  const status = data?.lot.status
  const boundary =
    status === 'SCHEDULED'
      ? data?.lot.startsAt
      : status === 'LIVE'
        ? data?.lot.endsAt
        : undefined
  const clockOffsetMs = data?.clockOffsetMs ?? 0
  const awaitingSettlement = status === 'ENDED' && data?.lot.result === null

  useEffect(() => {
    if (!boundary && !awaitingSettlement) return
    const waitMs = boundary
      ? Math.min(
          MAX_TIMEOUT_MS - MARGIN_MS,
          Math.max(0, Date.parse(boundary) - serverNowMs(clockOffsetMs)),
        )
      : AWAITING_SETTLEMENT_MS - MARGIN_MS
    const timer = window.setTimeout(() => {
      void queryClient.invalidateQueries({
        queryKey: lotsKeys.detail(id),
        exact: true,
      })
    }, waitMs + MARGIN_MS)
    return () => window.clearTimeout(timer)
  }, [
    awaitingSettlement,
    boundary,
    clockOffsetMs,
    dataUpdatedAt,
    id,
    queryClient,
  ])
}
