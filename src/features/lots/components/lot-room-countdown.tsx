import { TimerReset } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

import { useEndsAtExtension } from '../hooks/useEndsAtExtension'
import type { Lot } from '../types/lot-types'
import { LotCountdown } from './lot-countdown'

/** "+2 min", "+1 min 30 s", "+40 s". */
function formatExtension(ms: number) {
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const parts = [
    minutes > 0 ? `${minutes} min` : '',
    seconds > 0 ? `${seconds} s` : '',
  ]
  return `+${parts.filter(Boolean).join(' ')}`
}

type LotRoomCountdownProps = {
  lot: Pick<Lot, 'status' | 'startsAt' | 'endsAt' | 'canceledAt'>
  nowMs: number
}

/** Contagem da sala com o destaque curto da prorrogação do anti-sniping (RN-10). */
export function LotRoomCountdown({ lot, nowMs }: LotRoomCountdownProps) {
  const extensionMs = useEndsAtExtension(lot.endsAt)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <LotCountdown lot={lot} nowMs={nowMs} />
      {extensionMs !== null && lot.status === 'LIVE' ? (
        <Badge
          variant="secondary"
          className="animate-in zoom-in-95 fade-in"
          role="status"
          data-testid="lot-extended"
        >
          <TimerReset aria-hidden />
          Prorrogado {formatExtension(extensionMs)}
        </Badge>
      ) : null}
    </div>
  )
}
