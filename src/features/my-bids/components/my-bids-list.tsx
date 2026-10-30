import { Link } from '@tanstack/react-router'
import { Trophy } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useMyBids } from '../hooks/useMyBids'
import { MyBidCard } from './my-bid-card'

/** "Meus arremates": lotes em que o licitante deu lance, mais recentes primeiro. */
export function MyBidsList() {
  const { data, isPending, isError, error, refetch } = useMyBids()

  if (isPending) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title="Não foi possível carregar seus lances"
        error={error}
        onRetry={() => void refetch()}
      />
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        className="border border-dashed py-8"
        icon={<Trophy />}
        title="Você ainda não deu lances"
        description="Os lotes em que você der lance aparecem aqui, com a sua posição."
        action={
          <Button asChild>
            <Link to="/">Ver lotes na vitrine</Link>
          </Button>
        }
      />
    )
  }

  return (
    <ul className="grid gap-4 lg:grid-cols-2" aria-label="Lotes com lance seu">
      {data.map((bid) => (
        <li key={bid.lot.id}>
          <MyBidCard bid={bid} />
        </li>
      ))}
    </ul>
  )
}
