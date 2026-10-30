import type { ComponentProps } from 'react'

import { Badge } from '@/components/ui/badge'

import { LOT_STATUS_LABELS } from '../schemas/lot-schemas'
import type { LotStatus } from '../types/lot-types'

const VARIANTS: Record<LotStatus, ComponentProps<typeof Badge>['variant']> = {
  LIVE: 'destructive',
  SCHEDULED: 'secondary',
  ENDED: 'outline',
  CANCELED: 'outline',
}

export function LotStatusBadge({ status }: { status: LotStatus }) {
  return (
    <Badge variant={VARIANTS[status]} data-testid="lot-status">
      {status === 'LIVE' ? (
        <span
          className="size-1.5 animate-pulse rounded-full bg-current"
          aria-hidden
        />
      ) : null}
      {LOT_STATUS_LABELS[status]}
    </Badge>
  )
}
