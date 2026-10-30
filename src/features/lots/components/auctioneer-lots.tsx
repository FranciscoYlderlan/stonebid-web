import { ErrorState } from '@/components/common/error-state'
import { useServerNow } from '@/hooks/useServerNow'

import { useAuctioneerLots } from '../hooks/useAuctioneerLots'
import type { LotStatus } from '../types/lot-types'
import { CancelLotButton } from './cancel-lot-button'
import { LotSection } from './lot-section'
import { LotSectionSkeleton } from './lot-section-skeleton'

const GROUPS: { status: LotStatus; title: string; empty: string }[] = [
  { status: 'LIVE', title: 'Ao vivo', empty: 'Nenhum lote ao vivo' },
  { status: 'SCHEDULED', title: 'Agendados', empty: 'Nenhum lote agendado' },
  { status: 'ENDED', title: 'Encerrados', empty: 'Nenhum lote encerrado' },
  { status: 'CANCELED', title: 'Cancelados', empty: 'Nenhum lote cancelado' },
]

const CANCELABLE: readonly LotStatus[] = ['SCHEDULED', 'LIVE']

/** Lote a realçar; `nonce` muda a cada pedido, para rolar de novo até ele. */
export type LotHighlight = { lotId: string; nonce: number }

/** "Meus lotes" (RF-25): só os do leiloeiro, por estado, com Cancelar nos que não acabaram. */
export function AuctioneerLots({
  highlight = null,
}: {
  highlight?: LotHighlight | null
}) {
  const { data, isPending, isError, error, refetch } = useAuctioneerLots()
  const nowMs = useServerNow(data?.clockOffsetMs ?? 0)

  return (
    <section aria-labelledby="my-lots-heading" className="space-y-8">
      <h2 id="my-lots-heading" className="font-heading text-2xl font-semibold">
        Meus lotes
      </h2>
      {isPending ? (
        <LotSectionSkeleton />
      ) : isError ? (
        <ErrorState
          title="Não foi possível carregar seus lotes"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : (
        GROUPS.map(({ status, title, empty }) => (
          <LotSection
            key={status}
            id={`mine-${status.toLowerCase()}`}
            title={title}
            lots={data.items.filter((lot) => lot.status === status)}
            nowMs={nowMs}
            emptyTitle={empty}
            highlight={highlight}
            renderAction={(lot) =>
              CANCELABLE.includes(lot.status) ? (
                <CancelLotButton lot={lot} />
              ) : null
            }
          />
        ))
      )}
    </section>
  )
}
