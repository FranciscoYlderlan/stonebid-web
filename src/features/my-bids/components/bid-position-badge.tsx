import type { ComponentProps } from 'react'

import { Badge } from '@/components/ui/badge'

import { BID_POSITION_LABELS } from '../schemas/my-bids-schemas'
import type { BidPosition } from '../types/my-bids-types'

const VARIANTS: Record<BidPosition, ComponentProps<typeof Badge>['variant']> = {
  LEADING: 'default',
  OUTBID: 'destructive',
  WON: 'default',
  LOST: 'secondary',
  CANCELED: 'outline',
}

export function BidPositionBadge({ position }: { position: BidPosition }) {
  return (
    <Badge variant={VARIANTS[position]} data-testid="bid-position">
      {BID_POSITION_LABELS[position]}
    </Badge>
  )
}
