import { createFileRoute } from '@tanstack/react-router'
import { WalletMinimal } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { PageHeader } from '@/components/common/page-header'
import {
  movementsQueryOptions,
  walletQueryOptions,
  WalletOverview,
} from '@/features/wallet'

// Carteira: só licitante. O servidor também recusa (RF-02); aqui é só a tela certa.
export const Route = createFileRoute('/_app/wallet/')({
  loader: async ({ context }) => {
    if (context.user.role !== 'BIDDER') return
    await Promise.all([
      context.queryClient.prefetchQuery(walletQueryOptions()),
      context.queryClient.prefetchQuery(movementsQueryOptions()),
    ])
  },
  component: WalletPage,
})

function WalletPage() {
  const { user } = Route.useRouteContext()
  return (
    <div className="space-y-8">
      <PageHeader
        title="Carteira"
        description="Saldo simulado para dar lances."
      />
      {user.role === 'BIDDER' ? (
        <WalletOverview />
      ) : (
        <EmptyState
          icon={<WalletMinimal />}
          title="Leiloeiros não têm carteira"
          description="A carteira é de quem dá lances. Seus lotes ficam no painel do leiloeiro."
        />
      )}
    </div>
  )
}
