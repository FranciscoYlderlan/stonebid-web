import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import {
  lotEventsUrl,
  lotQueryOptions,
  lotsKeys,
  parseLotEvent,
} from '../api/lots-api'
import { isFinalLot, LOT_STREAM_EVENTS } from '../schemas/lot-schemas'
import type { LotDetail } from '../types/lot-types'

/**
 * O `EventSource` desiste de vez quando a reconexão recebe erro HTTP (ex.: 503 no deploy);
 * aí a sala abre outro depois desta espera, com a recarga de 3 s valendo até lá.
 */
const RECONNECT_MS = 5_000

/**
 * Tempo real da sala (AD-04): `EventSource` em `GET /lots/:id/events`. Cada evento traz o
 * lote inteiro, que entra no cache do detalhe; o histórico recarrega. O stream é público e
 * vem com `viewer` nulo, então o `viewer` do cache (do `GET /lots/:id` com JWT) fica.
 * O `EventSource` reconecta sozinho (e, se desistir, a sala abre outro); devolve `true` só enquanto o stream está no ar, para a
 * sala ligar a recarga de 3 s quando ele cai. Lote final (encerrado e liquidado, ou
 * cancelado) fecha o stream.
 */
export function useLotStream(id: string): boolean {
  const queryClient = useQueryClient()
  const { data: enabled = false } = useQuery({
    ...lotQueryOptions(id),
    select: ({ lot }) => !isFinalLot(lot),
  })
  const [openFor, setOpenFor] = useState<string | null>(null)
  // Cada valor novo abre outro `EventSource` (depois de o navegador desistir do anterior).
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled || typeof EventSource === 'undefined') return
    const source = new EventSource(lotEventsUrl(id))

    let retryTimer: number | undefined

    const onOpen = () => setOpenFor(id)
    // Queda: o navegador tenta reconectar; até lá vale a recarga.
    const onError = () => {
      setOpenFor(null)
      if (source.readyState === EventSource.CLOSED && retryTimer === undefined)
        retryTimer = window.setTimeout(
          () => setAttempt((value) => value + 1),
          RECONNECT_MS,
        )
    }
    const onLot = (event: MessageEvent<string>) => {
      const next = parseLotEvent(event.data)
      if (!next) {
        console.error('Evento do stream do lote fora do contrato', event.data)
        return
      }
      setOpenFor(id)
      queryClient.setQueryData<LotDetail>(lotsKeys.detail(id), (old) => ({
        clockOffsetMs: next.clockOffsetMs,
        lot: { ...next.lot, viewer: old?.lot.viewer ?? next.lot.viewer },
      }))
      void queryClient.invalidateQueries({
        queryKey: lotsKeys.bids(id),
        exact: true,
      })
    }

    source.addEventListener('open', onOpen)
    source.addEventListener('error', onError)
    for (const type of LOT_STREAM_EVENTS) source.addEventListener(type, onLot)
    return () => {
      window.clearTimeout(retryTimer)
      source.close()
    }
  }, [attempt, enabled, id, queryClient])

  return enabled && openFor === id
}
