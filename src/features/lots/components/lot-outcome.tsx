import { Ban, CalendarClock, Gavel, Hourglass, ReceiptText } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { formatCents } from '@/lib/money'
import { formatDateTime } from '@/lib/time'

import type { Lot } from '../types/lot-types'

type LotOutcomeProps = {
  lot: Pick<
    Lot,
    | 'status'
    | 'result'
    | 'currentBidCents'
    | 'leaderPseudonym'
    | 'receiptPublicId'
    | 'cancelReason'
    | 'canceledAt'
    | 'viewer'
  >
}

function Notice({
  icon,
  title,
  outcome,
  children,
}: {
  icon: ReactNode
  title: string
  outcome: string
  children?: ReactNode
}) {
  return (
    <div
      className="space-y-2 rounded-lg border bg-muted/40 p-4"
      role="status"
      data-testid="lot-outcome"
      data-outcome={outcome}
    >
      <p className="flex items-center gap-2 font-medium [&>svg]:size-4 [&>svg]:shrink-0">
        {icon}
        {title}
      </p>
      {children}
    </div>
  )
}

/**
 * O que a sala mostra no lugar do lance quando o lote não está ao vivo: agendado, encerrado
 * aguardando a liquidação, vendido (valor, vencedor e comprovante), sem vencedor ou
 * cancelado com a data e o motivo (também no cabeçalho da auditoria).
 */
export function LotOutcome({ lot }: LotOutcomeProps) {
  if (lot.status === 'SCHEDULED') {
    return (
      <Notice
        icon={<CalendarClock />}
        title="Os lances abrem quando o lote começar."
        outcome="scheduled"
      />
    )
  }

  if (lot.status === 'CANCELED') {
    return (
      <Notice icon={<Ban />} title="Lote cancelado" outcome="canceled">
        {lot.canceledAt ? (
          <p className="text-sm text-muted-foreground">
            Cancelado em{' '}
            <time
              dateTime={lot.canceledAt}
              className="text-foreground tabular-nums"
              data-testid="lot-canceled-at"
            >
              {formatDateTime(lot.canceledAt)}
            </time>
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Motivo:{' '}
          <span className="text-foreground" data-testid="lot-cancel-reason">
            {lot.cancelReason ?? 'não informado.'}
          </span>
        </p>
      </Notice>
    )
  }

  if (lot.status !== 'ENDED') return null

  if (lot.result === null) {
    return (
      <Notice
        icon={<Hourglass />}
        title="Encerrado. Aguardando a liquidação."
        outcome="awaiting"
      >
        <p className="text-sm text-muted-foreground">
          O resultado aparece aqui em instantes.
        </p>
      </Notice>
    )
  }

  if (lot.result === 'NO_WINNER') {
    return (
      <Notice
        icon={<Gavel />}
        title="Encerrado sem vencedor"
        outcome="no-winner"
      >
        <p className="text-sm text-muted-foreground">
          O lote terminou sem lances.
        </p>
      </Notice>
    )
  }

  const isWinner =
    lot.viewer !== null && lot.viewer.pseudonym === lot.leaderPseudonym
  return (
    <Notice
      icon={<Gavel />}
      title={isWinner ? 'Você arrematou este lote' : 'Vendido'}
      outcome="sold"
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Valor final</dt>
        <dd
          className="font-heading font-semibold tabular-nums"
          data-testid="lot-final-amount"
        >
          {lot.currentBidCents === null
            ? '—'
            : formatCents(lot.currentBidCents)}
        </dd>
        <dt className="text-muted-foreground">Vencedor</dt>
        <dd className="min-w-0 truncate font-medium" data-testid="lot-winner">
          {lot.leaderPseudonym ?? '—'}
        </dd>
      </dl>
      {lot.receiptPublicId ? (
        <Button asChild variant="outline" className="h-10 w-full">
          {/* Rota pública do comprovante (RF-50). */}
          <Link to="/receipts/$id" params={{ id: lot.receiptPublicId }}>
            <ReceiptText data-icon="inline-start" />
            Ver comprovante
          </Link>
        </Button>
      ) : null}
    </Notice>
  )
}
