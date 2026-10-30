import { Link } from '@tanstack/react-router'
import { ReceiptText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatCents } from '@/lib/money'

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
  >
}

/**
 * Como o lote terminou, para o leiloeiro: arrematado (valor, vencedor e comprovante),
 * sem lances, aguardando liquidação ou cancelado (com o motivo). Nada para lote em aberto.
 */
export function LotOutcome({ lot }: LotOutcomeProps) {
  if (lot.status === 'CANCELED') {
    return (
      <p className="w-full text-sm" data-testid="lot-outcome">
        <span className="text-muted-foreground">Motivo: </span>
        <span className="break-words">
          {lot.cancelReason ?? 'não informado'}
        </span>
      </p>
    )
  }
  if (lot.status !== 'ENDED') return null

  if (lot.result === 'SOLD') {
    return (
      <div
        className="flex w-full flex-wrap items-center justify-between gap-2"
        data-testid="lot-outcome"
      >
        <p className="text-sm">
          <span className="font-medium">
            Arrematado por {formatCents(lot.currentBidCents ?? 0)}
          </span>
          {lot.leaderPseudonym ? (
            <span className="block text-muted-foreground">
              {lot.leaderPseudonym}
            </span>
          ) : null}
        </p>
        {lot.receiptPublicId ? (
          <Button variant="outline" size="sm" asChild>
            <Link to="/receipts/$id" params={{ id: lot.receiptPublicId }}>
              <ReceiptText data-icon="inline-start" aria-hidden />
              Comprovante
            </Link>
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <p
      className="w-full text-sm text-muted-foreground"
      data-testid="lot-outcome"
    >
      {lot.result === 'NO_WINNER'
        ? 'Encerrado sem lances: não arrematado.'
        : 'Encerrado: aguardando a liquidação.'}
    </p>
  )
}
