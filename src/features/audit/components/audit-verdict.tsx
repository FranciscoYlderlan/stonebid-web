import {
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { formatDateTimeWithSeconds } from '@/lib/time'
import { cn } from '@/lib/utils'

import { AUDIT_REASON_LABELS } from '../schemas/audit-schemas'
import type { Audit } from '../types/audit-types'

type AuditVerdictProps = {
  audit: Pick<Audit, 'verdict' | 'firstInconsistency' | 'checkedAt'>
  checking: boolean
  onRecheck: () => void
}

/** Selo do veredito (ÍNTEGRO ou ADULTERADO), a hora da verificação e o primeiro problema. */
export function AuditVerdict({
  audit,
  checking,
  onRecheck,
}: AuditVerdictProps) {
  const intact = audit.verdict === 'INTACT'
  const Icon = intact ? ShieldCheck : ShieldAlert
  const issue = audit.firstInconsistency

  return (
    <section aria-labelledby="audit-verdict-heading" className="space-y-4">
      <div
        className={cn(
          'flex flex-col gap-4 rounded-xl border-2 p-5 sm:flex-row sm:items-center',
          intact
            ? 'border-emerald-600/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
            : 'border-destructive/60 bg-destructive/10 text-destructive',
        )}
        data-testid="audit-verdict"
        data-verdict={audit.verdict}
      >
        <Icon className="size-12 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium opacity-80">
            Veredito da auditoria
          </p>
          <h2
            id="audit-verdict-heading"
            className="font-heading text-3xl font-bold tracking-wide"
          >
            {intact ? 'ÍNTEGRO' : 'ADULTERADO'}
          </h2>
          <p className="text-sm text-foreground" data-testid="audit-checked-at">
            Verificado em {formatDateTimeWithSeconds(audit.checkedAt)}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 shrink-0 text-foreground"
          onClick={onRecheck}
          disabled={checking}
        >
          <RefreshCw
            data-icon="inline-start"
            className={cn(checking && 'animate-spin')}
            aria-hidden
          />
          {checking ? 'Verificando…' : 'Verificar de novo'}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        O veredito é recalculado a cada acesso: a API refaz o encadeamento dos
        hashes de todos os lances e confere o comprovante e a liquidação. Nada
        fica guardado de uma verificação para a outra.
      </p>
      {!intact && issue ? (
        <Alert variant="destructive" data-testid="audit-inconsistency">
          <TriangleAlert aria-hidden />
          <AlertTitle>
            Primeiro registro inconsistente:{' '}
            {issue.seq === null ? 'registro do lote' : `Lance nº ${issue.seq}`}
          </AlertTitle>
          <AlertDescription data-testid="audit-inconsistency-reason">
            {AUDIT_REASON_LABELS[issue.reason]}
          </AlertDescription>
        </Alert>
      ) : null}
    </section>
  )
}
