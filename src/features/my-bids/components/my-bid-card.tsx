import { Link } from '@tanstack/react-router'
import { ReceiptText } from 'lucide-react'

import { CoverImage } from '@/components/common/cover-image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { apiUrl } from '@/lib/api-client'
import { formatCents } from '@/lib/money'

import type { MyBid } from '../types/my-bids-types'
import { BidPositionBadge } from './bid-position-badge'

/** Um lote em que o licitante deu lance: posição, seu maior lance e o comprovante, se houver. */
export function MyBidCard({ bid }: { bid: MyBid }) {
  const { lot, position, myMaxBidCents, receiptPublicId } = bid
  return (
    <Card
      className="flex-row items-stretch gap-0 overflow-hidden py-0"
      data-testid="my-bid"
      data-lot-id={lot.id}
    >
      <CoverImage
        src={lot.imageUrl ? apiUrl(lot.imageUrl) : null}
        alt={lot.title}
        className="aspect-square w-24 shrink-0 sm:w-32"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="min-w-0 font-heading text-base font-semibold">
            <Link
              to="/lots/$id"
              params={{ id: lot.id }}
              className="line-clamp-2 hover:underline"
            >
              {lot.title}
            </Link>
          </h3>
          <BidPositionBadge position={position} />
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div>
            <dt className="text-muted-foreground">Seu maior lance</dt>
            <dd className="font-medium tabular-nums" data-testid="my-max-bid">
              {formatCents(myMaxBidCents)}
            </dd>
          </div>
          {lot.currentBidCents !== null ? (
            <div>
              <dt className="text-muted-foreground">
                {position === 'WON' || position === 'LOST'
                  ? 'Valor final'
                  : 'Lance atual'}
              </dt>
              <dd className="font-medium tabular-nums">
                {formatCents(lot.currentBidCents)}
              </dd>
            </div>
          ) : null}
        </dl>
        {position === 'CANCELED' && lot.cancelReason ? (
          <p className="text-sm break-words text-muted-foreground">
            Motivo do cancelamento: {lot.cancelReason}
          </p>
        ) : null}
        {receiptPublicId ? (
          <div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/receipts/$id" params={{ id: receiptPublicId }}>
                <ReceiptText data-icon="inline-start" aria-hidden />
                Ver comprovante
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
