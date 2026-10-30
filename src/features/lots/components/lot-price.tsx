import { formatCents } from '@/lib/money'

import type { Lot } from '../types/lot-types'

/** Lance atual, ou o inicial enquanto ninguém deu lance. */
export function LotPrice({
  lot,
}: {
  lot: Pick<Lot, 'currentBidCents' | 'startingBidCents'>
}) {
  const hasBid = lot.currentBidCents !== null
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {hasBid ? 'Lance atual' : 'Lance inicial'}
      </p>
      <p
        className="font-heading text-xl font-semibold tabular-nums"
        data-testid="lot-price"
      >
        {formatCents(lot.currentBidCents ?? lot.startingBidCents)}
      </p>
    </div>
  )
}
