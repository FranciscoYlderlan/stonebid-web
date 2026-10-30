import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

import { ITEM_AUCTION_LABELS } from '../schemas/lot-schemas'
import type { ItemAuction } from '../types/lot-types'

/** Selo "Em leilão" ou "Vendido" com link para o lote que bloqueia a obra. */
export function ItemAuctionBadge({ auction }: { auction: ItemAuction }) {
  const label = ITEM_AUCTION_LABELS[auction.status]
  return (
    <Badge
      asChild
      variant={auction.status === 'SOLD' ? 'outline' : 'secondary'}
      data-testid="item-auction"
      data-status={auction.status}
    >
      <Link
        to="/lots/$id"
        params={{ id: auction.lotId }}
        aria-label={`${label}: ver o lote`}
      >
        {label}
        <ArrowUpRight data-icon="inline-end" aria-hidden />
      </Link>
    </Badge>
  )
}
