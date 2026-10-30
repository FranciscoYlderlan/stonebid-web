import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'

import {
  BidPanel,
  bidHistoryQueryOptions,
  LotRoom,
  lotQueryOptions,
} from '@/features/lots'

// Sala do lote com lance: só licitante. O leiloeiro vai para a sala só para ver; a
// proteção real é do servidor (RF-02).
export const Route = createFileRoute('/_app/bidding/$id')({
  beforeLoad: ({ context, params }) => {
    if (context.user.role !== 'BIDDER') {
      throw redirect({ to: '/lots/$id', params: { id: params.id } })
    }
  },
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.prefetchQuery(lotQueryOptions(params.id)),
      context.queryClient.prefetchQuery(bidHistoryQueryOptions(params.id)),
    ]),
  component: BiddingPage,
})

function BiddingPage() {
  const { id } = Route.useParams()
  return (
    <LotRoom
      id={id}
      bidSlot={<BidPanel id={id} />}
      // Auditoria pública da cadeia de lances (RF-60), como na sala só para ver; o LotRoom
      // só mostra o slot com o lote carregado.
      auditSlot={
        <Button asChild variant="outline">
          <Link to="/lots/$id/audit" params={{ id }}>
            <ShieldCheck data-icon="inline-start" aria-hidden />
            Ver auditoria
          </Link>
        </Button>
      }
    />
  )
}
