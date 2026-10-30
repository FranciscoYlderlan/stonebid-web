import { cn } from '@/lib/utils'

import type { ItemAttributes as Attributes } from '../types/lot-types'

const LABELS: Record<keyof Attributes, string> = {
  artist: 'Artista',
  date: 'Data',
  medium: 'Técnica',
  dimensions: 'Dimensões',
  placeOfOrigin: 'Origem',
}

/** Atributos do item (copiados da API externa), só os que vieram preenchidos. */
export function ItemAttributes({
  attributes,
  className,
}: {
  attributes: Attributes
  className?: string
}) {
  const entries = (Object.keys(LABELS) as (keyof Attributes)[]).flatMap(
    (key) => (attributes[key] ? [[key, attributes[key]] as const] : []),
  )
  if (entries.length === 0) return null

  return (
    <dl
      className={cn(
        'grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm',
        className,
      )}
    >
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{LABELS[key]}</dt>
          <dd className="line-clamp-2">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
