import { Gavel } from 'lucide-react'
import type { ReactNode } from 'react'

import { EmptyState } from '@/components/common/empty-state'
import { CopyButton } from '@/features/receipts'
import { formatCents } from '@/lib/money'
import { formatDateTimeWithSeconds } from '@/lib/time'
import { cn } from '@/lib/utils'

import type { AuditBid } from '../types/audit-types'

/** Quantos caracteres do hash a tabela mostra; o botão copia o hash inteiro. */
const SHORT_HASH_LENGTH = 12

/** Célula que, no celular, vira uma linha "rótulo: valor" do cartão do lance. */
function Cell({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <td
      className={cn(
        'flex items-center justify-between gap-3 py-1 md:table-cell md:px-4 md:py-3',
        className,
      )}
    >
      <span className="text-xs text-muted-foreground md:hidden" aria-hidden>
        {label}
      </span>
      {children}
    </td>
  )
}

/**
 * Histórico completo da cadeia, do primeiro ao último lance: ordem, pseudônimo, valor, hora
 * com segundos e o hash. Em telas estreitas cada lance vira um cartão, sem rolagem lateral.
 */
export function AuditBidTable({
  bids,
  highlightSeq,
}: {
  bids: AuditBid[]
  /** Lance do primeiro registro inconsistente, destacado. */
  highlightSeq: number | null
}) {
  return (
    <section aria-labelledby="audit-history-heading" className="space-y-4">
      <h2
        id="audit-history-heading"
        className="font-heading text-xl font-semibold"
      >
        Histórico completo de lances
      </h2>
      {bids.length === 0 ? (
        <EmptyState
          icon={<Gavel />}
          title="Nenhum lance registrado"
          description="A cadeia deste lote ainda não tem lances."
        />
      ) : (
        <table
          className="block w-full text-sm md:table md:rounded-xl md:border"
          data-testid="audit-bids"
        >
          <thead className="sr-only md:not-sr-only">
            <tr className="border-b text-left text-muted-foreground">
              <th scope="col" className="px-4 py-3 font-medium">
                Ordem
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Pseudônimo
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Valor
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Horário
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Hash
              </th>
            </tr>
          </thead>
          <tbody className="block space-y-3 md:table-row-group md:space-y-0">
            {bids.map((bid) => {
              const highlighted = bid.seq === highlightSeq
              return (
                <tr
                  key={bid.seq}
                  data-testid={`audit-bid-${bid.seq}`}
                  data-inconsistent={highlighted || undefined}
                  aria-current={highlighted ? 'true' : undefined}
                  className={cn(
                    'block rounded-xl border p-3 md:table-row md:rounded-none md:border-0 md:border-b md:p-0 md:last:border-b-0',
                    highlighted &&
                      'border-destructive bg-destructive/10 md:outline-2 md:-outline-offset-2 md:outline-destructive',
                  )}
                >
                  <Cell label="Ordem" className="font-medium tabular-nums">
                    <span>
                      nº {bid.seq}
                      {highlighted ? (
                        <span className="ml-2 text-xs font-semibold text-destructive">
                          Inconsistente
                        </span>
                      ) : null}
                    </span>
                  </Cell>
                  <Cell label="Pseudônimo">
                    <span className="min-w-0 truncate">{bid.pseudonym}</span>
                  </Cell>
                  <Cell label="Valor" className="md:text-right">
                    <span className="font-heading font-semibold tabular-nums">
                      {formatCents(bid.amountCents)}
                    </span>
                  </Cell>
                  <Cell label="Horário" className="tabular-nums">
                    <span>{formatDateTimeWithSeconds(bid.createdAt)}</span>
                  </Cell>
                  <Cell label="Hash">
                    <span className="flex items-center gap-2">
                      <code
                        className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs"
                        title={bid.hash}
                        data-testid="audit-bid-hash"
                      >
                        {bid.hash.slice(0, SHORT_HASH_LENGTH)}
                      </code>
                      <CopyButton
                        text={bid.hash}
                        label="Copiar"
                        aria-label={`Copiar hash do lance nº ${bid.seq}`}
                        successMessage="Hash copiado."
                        variant="ghost"
                      />
                    </span>
                  </Cell>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
