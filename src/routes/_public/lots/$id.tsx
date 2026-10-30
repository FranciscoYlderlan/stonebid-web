import { createFileRoute } from '@tanstack/react-router'

import { LotDetails, lotQueryOptions } from '@/features/lots'

// Lote só para ver (RF-03). A sala ao vivo com lances chega em outro incremento.
export const Route = createFileRoute('/_public/lots/$id')({
  loader: ({ context, params }) =>
    context.queryClient.prefetchQuery(lotQueryOptions(params.id)),
  component: LotPage,
})

function LotPage() {
  const { id } = Route.useParams()
  return <LotDetails id={id} />
}
