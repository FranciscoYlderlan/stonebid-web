import { Link } from '@tanstack/react-router'
import { FileX, ShieldCheck } from 'lucide-react'

import { CopyButton } from '@/components/common/copy-button'
import { CoverImage } from '@/components/common/cover-image'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { apiUrl, isApiError } from '@/lib/api-client'
import { formatCents } from '@/lib/money'
import { formatDateTimeWithSeconds } from '@/lib/time'

import { useReceipt } from '../hooks/useReceipt'
import { RECEIPT_NOT_FOUND } from '../schemas/receipt-schemas'

/**
 * Comprovante público do arremate (RF-51, RF-52): item, valor, data e hora, pseudônimo do
 * vencedor, hash final e o caminho para a auditoria. Abre sem login.
 */
export function ReceiptView({ publicId }: { publicId: string }) {
  const { data, isPending, isError, error, refetch } = useReceipt(publicId)

  if (isPending) {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-4/3 w-full rounded-xl" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (isError) {
    if (
      isApiError(error, RECEIPT_NOT_FOUND) ||
      (isApiError(error) && error.status === 404)
    ) {
      return (
        <EmptyState
          icon={<FileX />}
          title="Comprovante não encontrado"
          description="Este link não corresponde a nenhum comprovante válido. Confira se o endereço foi copiado inteiro."
          action={
            <Button asChild>
              <Link to="/">Voltar à vitrine</Link>
            </Button>
          }
        />
      )
    }
    return (
      <ErrorState
        title="Não foi possível carregar o comprovante"
        error={error}
        onRetry={() => void refetch()}
      />
    )
  }

  const receipt = data
  const rows = [
    ['Valor final', formatCents(receipt.finalAmountCents), 'receipt-amount'],
    [
      'Data e hora',
      formatDateTimeWithSeconds(receipt.settledAt),
      'receipt-settled-at',
    ],
    ['Vencedor', receipt.winnerPseudonym, 'receipt-winner'],
  ] as const

  return (
    <article className="grid min-w-0 gap-8 md:grid-cols-2">
      <CoverImage
        src={receipt.imageUrl ? apiUrl(receipt.imageUrl) : null}
        alt={receipt.title}
        className="rounded-xl"
      />
      <div className="min-w-0 space-y-6">
        <header className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <ShieldCheck className="size-4" aria-hidden />
            Comprovante de arremate
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {receipt.title}
          </h1>
        </header>
        <Card>
          <CardContent className="space-y-5">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              {rows.map(([label, value, testId]) => (
                <div key={label} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium tabular-nums" data-testid={testId}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground" id="final-hash">
                Hash final do histórico de lances
              </p>
              <code
                aria-labelledby="final-hash"
                className="block rounded-md bg-muted p-3 font-mono text-xs break-all"
                data-testid="receipt-hash"
              >
                {receipt.finalHash}
              </code>
              <CopyButton
                text={receipt.finalHash}
                label="Copiar hash"
                successMessage="Hash copiado."
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-2">
          <CopyButton
            text={() =>
              `${window.location.origin}/receipts/${encodeURIComponent(receipt.publicId)}`
            }
            label="Copiar link"
            successMessage="Link do comprovante copiado."
            variant="default"
            size="default"
          />
          <Button variant="outline" asChild>
            {/* A auditoria confere o hash final contra o histórico, sem login (RF-60). */}
            <Link to="/lots/$id/audit" params={{ id: receipt.lotId }}>
              Ver auditoria do lote
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
