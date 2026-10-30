import { TrendingDown, Trophy } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { BidHistoryItem, Lot } from '../types/lot-types'

type ViewerPositionProps = {
  lot: Pick<Lot, 'status' | 'leaderPseudonym' | 'viewer'>
  history: BidHistoryItem[] | undefined
}

/**
 * Indicador do RF-30, só para o licitante logado (`viewer` do `GET /lots/:id`) com o lote ao
 * vivo: lidera → "Você está ganhando"; deu lance e não lidera → "Você foi superado".
 */
export function ViewerPosition({ lot, history }: ViewerPositionProps) {
  const pseudonym = lot.viewer?.pseudonym
  if (!pseudonym || lot.status !== 'LIVE') return null

  const winning = lot.leaderPseudonym === pseudonym
  const hasBid = history?.some((bid) => bid.pseudonym === pseudonym) ?? false
  if (!winning && !hasBid) return null

  const Icon = winning ? Trophy : TrendingDown
  return (
    <p
      role="status"
      data-testid="viewer-position"
      data-position={winning ? 'winning' : 'outbid'}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
        winning
          ? 'bg-primary/10 text-primary'
          : 'bg-destructive/10 text-destructive',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {winning ? 'Você está ganhando' : 'Você foi superado'}
    </p>
  )
}
