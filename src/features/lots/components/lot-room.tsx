import type { ReactNode } from 'react'

import { CoverImage } from '@/components/common/cover-image'
import { ErrorState } from '@/components/common/error-state'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useServerNow } from '@/hooks/useServerNow'
import { apiUrl, isApiError } from '@/lib/api-client'
import { formatCents } from '@/lib/money'
import { formatDateTime } from '@/lib/time'

import { LOT_ROOM_FALLBACK_REFETCH_MS } from '../api/lots-api'
import { useBidHistory } from '../hooks/useBidHistory'
import { useLot } from '../hooks/useLot'
import { useLotPhaseRefresh } from '../hooks/useLotPhaseRefresh'
import { useLotStream } from '../hooks/useLotStream'
import { isFinalLot } from '../schemas/lot-schemas'
import { BidHistory } from './bid-history'
import { ItemAttributes } from './item-attributes'
import { LotOutcome } from './lot-outcome'
import { LotPrice } from './lot-price'
import { LotRoomCountdown } from './lot-room-countdown'
import { LotStatusBadge } from './lot-status-badge'
import { ViewerPosition } from './viewer-position'

type LotRoomProps = {
  id: string
  /**
   * O que muda conforme quem vê: na `/lots/$id` o botão "Dar lance", na `/bidding/$id` o
   * painel de lance. Quem decide é a rota; a sala não sabe quem está logado. Aparece só com
   * o lote ao vivo; `null` não mostra nada (leiloeiro).
   */
  bidSlot: ReactNode
}

/**
 * Sala do lote ao vivo: obra, lance atual e líder, contagem, histórico público e o espaço do
 * lance. Atualiza pelo stream SSE (`useLotStream`); com o stream fora, recarrega a cada 3 s.
 */
export function LotRoom({ id, bidSlot }: LotRoomProps) {
  const streaming = useLotStream(id)
  const fallbackMs = streaming ? false : LOT_ROOM_FALLBACK_REFETCH_MS
  const { data, dataUpdatedAt, isPending, isError, error, refetch } = useLot(
    id,
    // Lote final ou com erro (ex.: 404) não recarrega sozinho.
    (query) =>
      query.state.status === 'error' ||
      (query.state.data && isFinalLot(query.state.data.lot))
        ? false
        : fallbackMs,
  )
  const final = data ? isFinalLot(data.lot) : false
  const history = useBidHistory(id, final ? false : fallbackMs)
  const nowMs = useServerNow(data?.clockOffsetMs ?? 0)
  useLotPhaseRefresh(id, data, dataUpdatedAt)

  if (isPending) {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-4/3 w-full rounded-xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title={
          isApiError(error) && error.status === 404
            ? 'Lote não encontrado'
            : 'Não foi possível carregar o lote'
        }
        error={error}
        onRetry={() => void refetch()}
      />
    )
  }

  const { lot } = data
  const rows = [
    ['Lance inicial', formatCents(lot.startingBidCents)],
    ['Incremento mínimo', formatCents(lot.minIncrementCents)],
    ['Início', formatDateTime(lot.startsAt)],
    ['Fim', formatDateTime(lot.endsAt)],
  ] as const

  return (
    <article className="grid min-w-0 gap-8 md:grid-cols-2">
      <CoverImage
        src={lot.imageUrl ? apiUrl(lot.imageUrl) : null}
        alt={lot.title}
        className="rounded-xl"
      />
      <div className="min-w-0 space-y-6">
        <header className="space-y-2">
          <LotStatusBadge status={lot.status} />
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {lot.title}
          </h1>
        </header>
        <Card>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <LotPrice lot={lot} />
              {lot.leaderPseudonym && lot.status === 'LIVE' ? (
                <p className="text-sm text-muted-foreground">
                  Liderando:{' '}
                  <span
                    className="font-medium text-foreground"
                    data-testid="lot-leader"
                  >
                    {lot.leaderPseudonym}
                  </span>
                </p>
              ) : null}
              <LotRoomCountdown lot={lot} nowMs={nowMs} />
            </div>
            <ViewerPosition lot={lot} history={history.data} />
            {lot.status === 'LIVE' ? bidSlot : <LotOutcome lot={lot} />}
          </CardContent>
        </Card>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <section className="space-y-2">
          <h2 className="font-heading text-lg font-semibold">Sobre o item</h2>
          <ItemAttributes attributes={lot.attributes} />
        </section>
      </div>
      <BidHistory history={history} className="md:col-span-2" />
    </article>
  )
}
