import { createFileRoute } from '@tanstack/react-router'

import { ReceiptView, receiptQueryOptions } from '@/features/receipts'

// Comprovante público (RF-03, RF-52): aberto a todos, sem ler a sessão. O id é o
// `publicId` aleatório do comprovante.
export const Route = createFileRoute('/_public/receipts/$id')({
  loader: ({ context, params }) =>
    context.queryClient.prefetchQuery(receiptQueryOptions(params.id)),
  component: ReceiptPage,
})

function ReceiptPage() {
  const { id } = Route.useParams()
  return <ReceiptView publicId={id} />
}
