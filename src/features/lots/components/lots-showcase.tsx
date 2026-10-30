import { CalendarClock, Flag, Radio } from 'lucide-react'

import { ErrorState } from '@/components/common/error-state'
import { useServerNow } from '@/hooks/useServerNow'

import { useShowcase } from '../hooks/useShowcase'
import { LotSection } from './lot-section'
import { LotSectionSkeleton } from './lot-section-skeleton'

/** Vitrine pública (RF-10): ao vivo, agendados e encerrados; cancelados não aparecem. */
export function LotsShowcase() {
  const { data, isPending, isError, error, refetch } = useShowcase()
  const nowMs = useServerNow(data?.clockOffsetMs ?? 0)

  if (isPending) {
    return (
      <div className="space-y-10">
        <LotSectionSkeleton />
        <LotSectionSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title="Não foi possível carregar a vitrine"
        error={error}
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div className="space-y-12">
      <LotSection
        id="live"
        title="Ao vivo"
        icon={<Radio className="size-5 text-destructive" aria-hidden />}
        lots={data.live}
        nowMs={nowMs}
        emptyTitle="Nenhum lote ao vivo agora"
        emptyDescription="Confira os agendados: a disputa começa na hora marcada."
      />
      <LotSection
        id="scheduled"
        title="Agendados"
        icon={<CalendarClock className="size-5" aria-hidden />}
        lots={data.scheduled}
        nowMs={nowMs}
        emptyTitle="Nenhum lote agendado"
        emptyDescription="Quando um leiloeiro publicar um lote, ele aparece aqui."
      />
      <LotSection
        id="ended"
        title="Encerrados"
        icon={<Flag className="size-5" aria-hidden />}
        lots={data.ended}
        nowMs={nowMs}
        emptyTitle="Nenhum lote encerrado ainda"
      />
    </div>
  )
}
