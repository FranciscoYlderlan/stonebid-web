import { Gavel } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCents } from '@/lib/money'
import { formatDateTimeWithSeconds } from '@/lib/time'
import { cn } from '@/lib/utils'

import { useBidHistory } from '../hooks/useBidHistory'

/** Histórico público de lances: pseudônimo, valor e hora, do mais novo ao mais antigo. */
export function BidHistory({
  id,
  className,
}: {
  id: string
  className?: string
}) {
  const history = useBidHistory(id)

  return (
    <section
      aria-labelledby="bid-history-heading"
      className={cn('min-w-0 space-y-4', className)}
    >
      <h2
        id="bid-history-heading"
        className="font-heading text-xl font-semibold"
      >
        Histórico de lances
      </h2>
      {history.isPending ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : history.isError ? (
        <ErrorState
          title="Não foi possível carregar o histórico"
          error={history.error}
          onRetry={() => void history.refetch()}
        />
      ) : history.data.length === 0 ? (
        <EmptyState
          icon={<Gavel />}
          title="Nenhum lance ainda"
          description="O primeiro lance aparece aqui."
        />
      ) : (
        <ol className="divide-y rounded-xl border" data-testid="bid-history">
          {history.data.map((bid) => (
            <li
              key={bid.seq}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{bid.pseudonym}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatDateTimeWithSeconds(bid.createdAt)}
                </p>
              </div>
              <p className="shrink-0 font-heading font-semibold tabular-nums">
                {formatCents(bid.amountCents)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
