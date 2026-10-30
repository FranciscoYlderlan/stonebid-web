import { CoverImage } from '@/components/common/cover-image'
import { ErrorState } from '@/components/common/error-state'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useServerNow } from '@/hooks/useServerNow'
import { apiUrl, isApiError } from '@/lib/api-client'
import { formatCents } from '@/lib/money'
import { formatDateTime } from '@/lib/time'

import { useLot } from '../hooks/useLot'
import { ItemAttributes } from './item-attributes'
import { LotCountdown } from './lot-countdown'
import { LotPrice } from './lot-price'
import { LotStatusBadge } from './lot-status-badge'

/** Dados do lote, só leitura. A sala ao vivo (lances em tempo real) chega em outro incremento. */
export function LotDetails({ id }: { id: string }) {
  const { data, isPending, isError, error, refetch } = useLot(id)
  const nowMs = useServerNow(data?.clockOffsetMs ?? 0)

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
    <article className="grid gap-8 md:grid-cols-2">
      <CoverImage
        src={lot.imageUrl ? apiUrl(lot.imageUrl) : null}
        alt={lot.title}
        className="rounded-xl"
      />
      <div className="space-y-6">
        <header className="space-y-2">
          <LotStatusBadge status={lot.status} />
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {lot.title}
          </h1>
        </header>
        <Card>
          <CardContent className="space-y-2">
            <LotPrice lot={lot} />
            <LotCountdown lot={lot} nowMs={nowMs} />
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
    </article>
  )
}
