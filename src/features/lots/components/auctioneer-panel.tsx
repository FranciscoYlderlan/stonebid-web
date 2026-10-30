import { useState } from 'react'

import { useAuctioneerLots } from '../hooks/useAuctioneerLots'
import type { CatalogItem } from '../types/lot-types'
import { AuctioneerLots } from './auctioneer-lots'
import { CreateLotDialog } from './create-lot-dialog'
import { ItemSearch } from './item-search'

/** Painel do leiloeiro: busca no acervo, criação de lote e "Meus lotes". */
export function AuctioneerPanel() {
  const [selected, setSelected] = useState<CatalogItem | null>(null)
  // Mesma consulta de "Meus lotes" (em cache): dá a hora do servidor para validar o início.
  const { data } = useAuctioneerLots()

  return (
    <div className="space-y-12">
      <ItemSearch onSelect={setSelected} />
      <AuctioneerLots />
      <CreateLotDialog
        item={selected}
        clockOffsetMs={data?.clockOffsetMs ?? 0}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
