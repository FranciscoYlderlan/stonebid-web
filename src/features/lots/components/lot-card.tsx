import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { CoverImage } from '@/components/common/cover-image'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { apiUrl } from '@/lib/api-client'

import type { Lot } from '../types/lot-types'
import { LotCountdown } from './lot-countdown'
import { LotPrice } from './lot-price'

type LotCardProps = {
  lot: Lot
  nowMs: number
  /** Ação extra no rodapé (ex.: Cancelar, no painel do leiloeiro). */
  action?: ReactNode
}

/** Card de lote: imagem, título, lance e contagem. O card inteiro leva para /lots/$id. */
export function LotCard({ lot, nowMs, action }: LotCardProps) {
  return (
    <Card
      className="relative pt-0 transition-shadow focus-within:ring-2 focus-within:ring-ring hover:ring-foreground/25"
      data-testid="lot-card"
    >
      <CoverImage
        src={lot.imageUrl ? apiUrl(lot.imageUrl) : null}
        alt={lot.title}
      />
      <CardHeader>
        <CardTitle className="line-clamp-2 font-heading text-base">
          {/* O link cobre o card todo (after:inset-0); a ação do rodapé fica por cima. */}
          <Link
            to="/lots/$id"
            params={{ id: lot.id }}
            className="outline-none after:absolute after:inset-0"
          >
            {lot.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-auto space-y-1">
        <LotPrice lot={lot} />
        <LotCountdown lot={lot} nowMs={nowMs} />
      </CardContent>
      {action ? (
        <CardFooter className="relative z-10 justify-end">{action}</CardFooter>
      ) : null}
    </Card>
  )
}
