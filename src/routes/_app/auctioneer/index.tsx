import { createFileRoute } from '@tanstack/react-router'
import { Gavel } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { PageHeader } from '@/components/common/page-header'
import { AuctioneerPanel, auctioneerLotsQueryOptions } from '@/features/lots'

// Painel do leiloeiro: só leiloeiro. O servidor também recusa (RF-02).
export const Route = createFileRoute('/_app/auctioneer/')({
  loader: ({ context }) =>
    context.user.role === 'AUCTIONEER'
      ? context.queryClient.prefetchQuery(auctioneerLotsQueryOptions())
      : undefined,
  component: AuctioneerPage,
})

function AuctioneerPage() {
  const { user } = Route.useRouteContext()
  return (
    <div className="space-y-8">
      <PageHeader
        title="Painel do leiloeiro"
        description="Busque itens no acervo, monte lotes e acompanhe os seus."
      />
      {user.role === 'AUCTIONEER' ? (
        <AuctioneerPanel />
      ) : (
        <EmptyState
          icon={<Gavel />}
          title="Área do leiloeiro"
          description="Só contas de leiloeiro criam e cancelam lotes. Sua carteira fica em Carteira."
        />
      )}
    </div>
  )
}
