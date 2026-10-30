import type { ReactNode } from 'react'

import { EmptyState } from '@/components/common/empty-state'

import type { Lot } from '../types/lot-types'
import { LotCard } from './lot-card'

type LotSectionProps = {
  id: string
  title: string
  lots: Lot[]
  nowMs: number
  emptyTitle: string
  emptyDescription?: string
  icon?: ReactNode
  /** Ação por lote no rodapé do card (opcional). */
  renderAction?: (lot: Lot) => ReactNode
}

/** Uma seção de lotes (Ao vivo, Agendados...), com estado vazio próprio. */
export function LotSection({
  id,
  title,
  lots,
  nowMs,
  emptyTitle,
  emptyDescription,
  icon,
  renderAction,
}: LotSectionProps) {
  const headingId = `${id}-heading`
  return (
    <section aria-labelledby={headingId} data-testid={`section-${id}`}>
      <h2
        id={headingId}
        className="mb-4 flex items-center gap-2 font-heading text-xl font-semibold"
      >
        {icon}
        {title}
        <span className="text-sm font-normal text-muted-foreground tabular-nums">
          ({lots.length})
        </span>
      </h2>
      {lots.length === 0 ? (
        <EmptyState
          className="border border-dashed py-8"
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lots.map((lot) => (
            <LotCard
              key={lot.id}
              lot={lot}
              nowMs={nowMs}
              action={renderAction?.(lot)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
