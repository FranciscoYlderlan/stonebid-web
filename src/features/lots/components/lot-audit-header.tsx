import { Link } from '@tanstack/react-router'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

import { CoverImage } from '@/components/common/cover-image'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { apiUrl } from '@/lib/api-client'

import { useLot } from '../hooks/useLot'
import { LotOutcome } from './lot-outcome'
import { LotStatusBadge } from './lot-status-badge'

/**
 * Cabeçalho do lote na auditoria (RF-60): obra, status, resultado (o mesmo da sala) e o
 * caminho de volta à sala. Lê o `GET /lots/:id` público; a rota o passa à auditoria.
 */
export function LotAuditHeader({ id }: { id: string }) {
  const { data, isPending, isError } = useLot(id)

  if (isPending) return <Skeleton className="h-24 w-full" />

  return (
    <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
      {data ? (
        <CoverImage
          src={data.lot.imageUrl ? apiUrl(data.lot.imageUrl) : null}
          alt={data.lot.title}
          className="w-32 shrink-0 rounded-lg sm:w-40"
        />
      ) : null}
      <div className="min-w-0 flex-1 space-y-3">
        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <ShieldCheck className="size-4" aria-hidden />
          Auditoria do lote
        </p>
        {data ? (
          <>
            <h1 className="font-heading text-3xl font-semibold tracking-tight break-words">
              {data.lot.title}
            </h1>
            <LotStatusBadge status={data.lot.status} />
            <LotOutcome lot={data.lot} />
          </>
        ) : isError ? (
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Lote {id}
          </h1>
        ) : null}
        <Button asChild variant="outline">
          <Link to="/lots/$id" params={{ id }}>
            <ArrowLeft data-icon="inline-start" aria-hidden />
            Voltar à sala do lote
          </Link>
        </Button>
      </div>
    </header>
  )
}
