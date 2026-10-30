import { createFileRoute } from '@tanstack/react-router'
import { Trophy } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { PageHeader } from '@/components/common/page-header'
import { MyBidsList, myBidsQueryOptions } from '@/features/my-bids'

// Meus arremates: só licitante. O servidor também recusa (RF-02); aqui é só a tela certa.
export const Route = createFileRoute('/_app/my-bids/')({
  loader: ({ context }) =>
    context.user.role === 'BIDDER'
      ? context.queryClient.prefetchQuery(myBidsQueryOptions())
      : undefined,
  component: MyBidsPage,
})

function MyBidsPage() {
  const { user } = Route.useRouteContext()
  return (
    <div className="space-y-8">
      <PageHeader
        title="Meus arremates"
        description="Os lotes em que você deu lance, sua posição e os comprovantes."
      />
      {user.role === 'BIDDER' ? (
        <MyBidsList />
      ) : (
        <EmptyState
          icon={<Trophy />}
          title="Área do licitante"
          description="Só quem dá lances tem arremates. Seus lotes ficam no painel do leiloeiro."
        />
      )}
    </div>
  )
}
