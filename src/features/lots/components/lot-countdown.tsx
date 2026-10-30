import { formatCountdown, formatDateTime } from '@/lib/time'

import type { Lot } from '../types/lot-types'

type LotCountdownProps = {
  lot: Pick<Lot, 'status' | 'startsAt' | 'endsAt' | 'canceledAt'>
  /** Hora do servidor agora, em ms (useServerNow), nunca o relógio local sozinho. */
  nowMs: number
}

function describe({ lot, nowMs }: LotCountdownProps) {
  switch (lot.status) {
    case 'SCHEDULED': {
      const left = Date.parse(lot.startsAt) - nowMs
      return left > 0
        ? { label: 'Começa em', value: formatCountdown(left) }
        : { label: 'Começando', value: 'agora' }
    }
    case 'LIVE': {
      const left = Date.parse(lot.endsAt) - nowMs
      return left > 0
        ? { label: 'Termina em', value: formatCountdown(left) }
        : { label: 'Encerrando', value: 'agora' }
    }
    case 'ENDED':
      return { label: 'Encerrado em', value: formatDateTime(lot.endsAt) }
    case 'CANCELED':
      return {
        label: 'Cancelado em',
        value: formatDateTime(lot.canceledAt ?? lot.endsAt),
      }
  }
}

/** Contagem para o início (agendado) ou o fim (ao vivo), pela hora do servidor. */
export function LotCountdown(props: LotCountdownProps) {
  const { label, value } = describe(props)
  return (
    <p className="text-sm text-muted-foreground" data-testid="lot-countdown">
      {label}{' '}
      <span className="font-medium text-foreground tabular-nums">{value}</span>
    </p>
  )
}
