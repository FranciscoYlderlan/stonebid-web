import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '@/components/common/page-header'
import { LotsShowcase, showcaseQueryOptions } from '@/features/lots'

// Vitrine (RF-10): ao vivo, agendados e encerrados. Falha da API não bloqueia a navegação.
export const Route = createFileRoute('/_public/')({
  loader: ({ context }) =>
    context.queryClient.prefetchQuery(showcaseQueryOptions()),
  component: () => (
    <div className="space-y-10">
      <PageHeader
        title="Vitrine"
        description="Lotes ao vivo, agendados e encerrados."
      />
      <LotsShowcase />
    </div>
  ),
})
