import { Plus } from 'lucide-react'
import { useId } from 'react'

import { CoverImage } from '@/components/common/cover-image'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { apiUrl } from '@/lib/api-client'

import { ITEM_AUCTION_REASONS } from '../schemas/lot-schemas'
import type { CatalogItem } from '../types/lot-types'
import { ItemAuctionBadge } from './item-auction-badge'
import { ItemAttributes } from './item-attributes'

type CatalogItemCardProps = {
  item: CatalogItem
  onSelect: (item: CatalogItem) => void
}

/**
 * Resultado da busca na API externa: imagem, título, atributos e "Criar lote".
 * Obra em leilão ou vendida (RN-19): selo com link para o lote e botão desabilitado com o motivo.
 */
export function CatalogItemCard({ item, onSelect }: CatalogItemCardProps) {
  const reasonId = useId()
  const { auction } = item
  return (
    <Card className="pt-0" data-testid="catalog-item">
      <CoverImage
        src={item.imageUrl ? apiUrl(item.imageUrl) : null}
        alt={item.title}
      />
      <CardHeader>
        <CardTitle className="line-clamp-2">{item.title}</CardTitle>
        {auction ? <ItemAuctionBadge auction={auction} /> : null}
      </CardHeader>
      <CardContent className="flex-1">
        <ItemAttributes attributes={item.attributes} />
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2">
        {auction ? (
          <p id={reasonId} className="text-xs text-muted-foreground">
            {ITEM_AUCTION_REASONS[auction.status]}
          </p>
        ) : null}
        <Button
          className="w-full"
          disabled={auction !== null}
          aria-describedby={auction ? reasonId : undefined}
          onClick={() => onSelect(item)}
        >
          <Plus data-icon="inline-start" aria-hidden />
          Criar lote
        </Button>
      </CardFooter>
    </Card>
  )
}
