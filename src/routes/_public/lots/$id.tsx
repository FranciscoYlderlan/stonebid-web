import { createFileRoute, Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  bidHistoryQueryOptions,
  LotRoom,
  lotQueryOptions,
} from '@/features/lots'

// Sala do lote só para ver (RF-03): aberta a todos, sem ler a sessão. "Dar lance" leva à
// rota protegida; o guard do _app manda o visitante ao login e o traz de volta.
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
  return (
    <LotRoom
      id={id}
      bidSlot={
        <Button asChild className="h-10 w-full">
          <Link to="/bidding/$id" params={{ id }}>
            Dar lance
          </Link>
        </Button>
      }
    />
  )
}
