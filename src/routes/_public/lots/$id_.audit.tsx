import { createFileRoute } from '@tanstack/react-router'

import { AuditView } from '@/features/audit'

// Auditoria pública do lote (RF-60): aberta a todos, sem ler a sessão. `$id_` tira a rota de
// dentro da sala (`/lots/$id`): a página é própria, não um pedaço da sala. Sem prefetch no
// loader: o veredito é recalculado a cada acesso e a consulta roda ao montar.
export const Route = createFileRoute('/_public/lots/$id_/audit')({
  component: AuditPage,
})

function AuditPage() {
  const { id } = Route.useParams()
  return <AuditView lotId={id} />
}
