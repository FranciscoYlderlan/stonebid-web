import { Link } from '@tanstack/react-router'
import { ReceiptText } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCents } from '@/lib/money'
import { formatDateTime } from '@/lib/time'
import { cn } from '@/lib/utils'

import { MOVEMENT_TYPE_LABELS } from '../schemas/wallet-schemas'
import type { Movement, MovementType } from '../types/wallet-types'

/** Efeito de cada tipo no saldo disponível: + entra, − sai. */
const SIGN: Record<MovementType, 1 | -1> = {
  DEPOSIT: 1,
  RELEASE: 1,
  CREDIT: 1,
  REFUND: 1,
  COMMIT: -1,
  DEBIT: -1,
}

/** Extrato (RF-42): toda mudança de saldo tem uma linha. */
export function MovementsTable({ movements }: { movements: Movement[] }) {
  if (movements.length === 0) {
    return (
      <EmptyState
        className="border border-dashed py-8"
        icon={<ReceiptText />}
        title="Nenhum movimento ainda"
        description="Seus depósitos e lances aparecem aqui."
      />
    )
  }

  return (
    <Table data-testid="movements-table">
      <TableHeader>
        <TableRow>
          <TableHead>Tipo</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Lote</TableHead>
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((movement) => {
          const sign = SIGN[movement.type]
          return (
            <TableRow key={movement.id}>
              <TableCell className="font-medium">
                {MOVEMENT_TYPE_LABELS[movement.type]}
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {formatDateTime(movement.createdAt)}
              </TableCell>
              <TableCell>
                {movement.lotId ? (
                  <Link
                    to="/lots/$id"
                    params={{ id: movement.lotId }}
                    className="underline underline-offset-4"
                  >
                    Ver lote
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell
                className={cn(
                  'text-right font-medium tabular-nums',
                  sign > 0 ? 'text-emerald-600 dark:text-emerald-400' : '',
                )}
              >
                {sign > 0 ? '+' : '−'}{' '}
                {formatCents(Math.abs(movement.amountCents))}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
