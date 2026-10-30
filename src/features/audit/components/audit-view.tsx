import { Link } from '@tanstack/react-router'
import { FileX } from 'lucide-react'
import type { ReactNode } from 'react'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { isApiError } from '@/lib/api-client'

import { useLotAudit } from '../hooks/useLotAudit'
import { LOT_NOT_FOUND } from '../schemas/audit-schemas'
import { AuditBidTable } from './audit-bid-table'
import { AuditVerdict } from './audit-verdict'

/**
 * Auditoria pública do lote (RF-60): item e resultado, selo do veredito recalculado pela API
 * e a cadeia inteira de lances. Abre sem login e não mostra dado pessoal (só pseudônimos).
 */
export function AuditView({
  lotId,
  lotSlot,
}: {
  lotId: string
  /**
   * Cabeçalho do lote (obra, status, resultado e volta à sala). Quem compõe é a rota: a
   * auditoria não conhece a feature lots. Aparece só quando a auditoria carrega.
   */
  lotSlot: ReactNode
}) {
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

  const highlightSeq =
    data.verdict === 'TAMPERED' ? (data.firstInconsistency?.seq ?? null) : null

  return (
    <article className="min-w-0 space-y-8">
      {lotSlot}
      <AuditVerdict
        audit={data}
        checking={isFetching}
        onRecheck={() => void refetch()}
      />
      <AuditBidTable bids={data.bids} highlightSeq={highlightSeq} />
    </article>
  )
}
