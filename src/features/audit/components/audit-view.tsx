import { Link } from '@tanstack/react-router'
import { ArrowLeft, FileX, ShieldCheck } from 'lucide-react'

import { CoverImage } from '@/components/common/cover-image'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { LotOutcome, LotStatusBadge } from '@/features/lots'
import { apiUrl, isApiError } from '@/lib/api-client'

import { useLotAudit } from '../hooks/useLotAudit'
import { LOT_NOT_FOUND } from '../schemas/audit-schemas'
import { AuditBidTable } from './audit-bid-table'
import { AuditVerdict } from './audit-verdict'

/**
 * Auditoria pública do lote (RF-60): item e resultado, selo do veredito recalculado pela API
 * e a cadeia inteira de lances. Abre sem login e não mostra dado pessoal (só pseudônimos).
 */
export function AuditView({ lotId }: { lotId: string }) {
  const { data, isPending, isError, error, refetch, isFetching } =
    useLotAudit(lotId)

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (isError) {
    if (
      isApiError(error, LOT_NOT_FOUND) ||
      (isApiError(error) && error.status === 404)
    ) {
      return (
        <EmptyState
          icon={<FileX />}
          title="Lote não encontrado"
          description="Não há lote com este endereço para auditar. Confira se o link foi copiado inteiro."
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
        title="Não foi possível carregar a auditoria"
        error={error}
        onRetry={() => void refetch()}
      />
    )
  }

  const { lot } = data
  const highlightSeq =
    data.verdict === 'TAMPERED' ? (data.firstInconsistency?.seq ?? null) : null

  return (
    <article className="min-w-0 space-y-8">
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
        <CoverImage
          src={lot.imageUrl ? apiUrl(lot.imageUrl) : null}
          alt={lot.title}
          className="w-32 shrink-0 rounded-lg sm:w-40"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <ShieldCheck className="size-4" aria-hidden />
            Auditoria do lote
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight break-words">
            {lot.title}
          </h1>
          <LotStatusBadge status={lot.status} />
          <LotOutcome lot={lot} />
          <Button asChild variant="outline">
            <Link to="/lots/$id" params={{ id: lot.id }}>
              <ArrowLeft data-icon="inline-start" aria-hidden />
              Voltar à sala do lote
            </Link>
          </Button>
        </div>
      </header>
      <AuditVerdict
        audit={data}
        checking={isFetching}
        onRecheck={() => void refetch()}
      />
      <AuditBidTable bids={data.bids} highlightSeq={highlightSeq} />
    </article>
  )
}
