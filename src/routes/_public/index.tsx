import { createFileRoute } from '@tanstack/react-router'
import { Gavel } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { PageHeader } from '@/components/common/page-header'

// Vitrine. As seções ao vivo, agendados e encerrados (RF-10) chegam no I1.
export const Route = createFileRoute('/_public/')({
  component: () => (
    <div className="space-y-10">
      <PageHeader
        title="Vitrine"
        description="Lotes ao vivo, agendados e encerrados."
      />
      <EmptyState
        icon={<Gavel />}
        title="Nenhum lote ainda"
        description="Quando um leiloeiro publicar um lote, ele aparece aqui."
      />
    </div>
  ),
})
