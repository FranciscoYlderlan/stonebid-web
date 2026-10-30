import { ChevronLeft, ChevronRight, Search, SearchX } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/common/empty-state'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useDebounce } from '@/hooks/useDebounce'
import { getLoadErrorMessage } from '@/lib/load-error'

import { useItemSearch } from '../hooks/useItemSearch'
import type { CatalogItem } from '../types/lot-types'
import { CatalogItemCard } from './catalog-item-card'

const MIN_QUERY_LENGTH = 2

/** Busca de itens na API externa (RF-20). Falha da API externa vira aviso; o resto do painel segue. */
export function ItemSearch({
  onSelect,
}: {
  onSelect: (item: CatalogItem) => void
}) {
  const [text, setText] = useState('')
  const [page, setPage] = useState(1)
  const query = useDebounce(text.trim(), 400)
  const searchable = query.length >= MIN_QUERY_LENGTH
  const search = useItemSearch(searchable ? query : '', page)

  return (
    <section aria-labelledby="item-search-heading" className="space-y-4">
      <h2
        id="item-search-heading"
        className="font-heading text-xl font-semibold"
      >
        Buscar itens
      </h2>
      <div className="relative max-w-xl">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          aria-label="Buscar itens no acervo"
          placeholder="Ex.: Monet, retrato, cerâmica…"
          className="pl-8"
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            setPage(1)
          }}
        />
        {search.isFetching ? (
          <Spinner className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground" />
        ) : null}
      </div>

      {!searchable ? (
        <p className="text-sm text-muted-foreground">
          Digite pelo menos {MIN_QUERY_LENGTH} letras para buscar no acervo.
        </p>
      ) : search.isError ? (
        <Alert variant="destructive" data-testid="item-search-error">
          <SearchX aria-hidden />
          <AlertTitle>A busca de itens está indisponível</AlertTitle>
          <AlertDescription>
            {getLoadErrorMessage(search.error)}
          </AlertDescription>
        </Alert>
      ) : search.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="aspect-4/5 w-full rounded-xl" />
          ))}
        </div>
      ) : search.data.items.length === 0 ? (
        <EmptyState
          className="border border-dashed py-8"
          title="Nenhum item encontrado"
          description="Tente outro termo."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {search.data.items.map((item) => (
              <CatalogItemCard
                key={item.externalId}
                item={item}
                onSelect={onSelect}
              />
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || search.isFetching}
              onClick={() => setPage((current) => current - 1)}
            >
              <ChevronLeft data-icon="inline-start" aria-hidden />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums">
              Página {search.data.page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={search.isFetching || search.isPlaceholderData}
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima
              <ChevronRight data-icon="inline-end" aria-hidden />
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
