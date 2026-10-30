import { createFileRoute, Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  bidHistoryQueryOptions,
  LotRoom,
  lotQueryOptions,
} from '@/features/lots'

// Sala do lote só para ver (RF-03): aberta a todos e nunca redireciona. "Dar lance" leva à
// rota protegida; o guard do _app manda o visitante ao login e o traz de volta. O leiloeiro
// não dá lance (RN-06): para ele, a rota não passa o botão. O papel vem da sessão já
// resolvida no layout raiz, sem consulta nova.
export const Route = createFileRoute('/_public/lots/$id')({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.prefetchQuery(lotQueryOptions(params.id)),
      context.queryClient.prefetchQuery(bidHistoryQueryOptions(params.id)),
    ]),
  component: LotPage,
})

function LotPage() {
  const { id } = Route.useParams()
  const { user } = Route.useRouteContext()
  return (
    <LotRoom
      id={id}
      bidSlot={
        user?.role === 'AUCTIONEER' ? null : (
          <Button asChild className="h-10 w-full">
            <Link to="/bidding/$id" params={{ id }}>
              Dar lance
            </Link>
          </Button>
        )
      }
    />
  )
}
