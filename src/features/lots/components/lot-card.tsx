import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

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
  /**
   * Presente enquanto o card está realçado; a cada valor novo o card rola para o centro
   * da tela e recebe o foco (ex.: lote recém-criado no painel do leiloeiro).
   */
  highlightNonce?: number
}

/** Card de lote: imagem, título, lance e contagem. O card inteiro leva para /lots/$id. */
export function LotCard({ lot, nowMs, action, highlightNonce }: LotCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const linkRef = useRef<HTMLAnchorElement>(null)
  const highlighted = highlightNonce !== undefined

  useEffect(() => {
    if (highlightNonce === undefined) return
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    cardRef.current?.scrollIntoView({
      block: 'center',
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
    linkRef.current?.focus({ preventScroll: true })
  }, [highlightNonce])

  return (
    <Card
      ref={cardRef}
      className="relative scroll-mt-[calc(var(--header-height)+1rem)] pt-0 transition-[box-shadow,background-color] duration-500 focus-within:ring-2 focus-within:ring-ring hover:ring-foreground/25 data-highlighted:bg-primary/10 data-highlighted:shadow-lg data-highlighted:ring-2 data-highlighted:ring-primary motion-reduce:transition-none"
      data-testid="lot-card"
      data-lot-id={lot.id}
      data-highlighted={highlighted || undefined}
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
            ref={linkRef}
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
