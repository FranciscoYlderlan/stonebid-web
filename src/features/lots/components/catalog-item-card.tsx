import { Plus } from 'lucide-react'

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

import type { CatalogItem } from '../types/lot-types'
import { ItemAttributes } from './item-attributes'

type CatalogItemCardProps = {
  item: CatalogItem
  onSelect: (item: CatalogItem) => void
}

/** Resultado da busca na API externa: imagem, título, atributos e "Criar lote". */
export function CatalogItemCard({ item, onSelect }: CatalogItemCardProps) {
  return (
    <Card className="pt-0" data-testid="catalog-item">
      <CoverImage
        src={item.imageUrl ? apiUrl(item.imageUrl) : null}
        alt={item.title}
      />
      <CardHeader>
        <CardTitle className="line-clamp-2">{item.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ItemAttributes attributes={item.attributes} />
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => onSelect(item)}>
          <Plus data-icon="inline-start" aria-hidden />
          Criar lote
        </Button>
      </CardFooter>
    </Card>
  )
}
