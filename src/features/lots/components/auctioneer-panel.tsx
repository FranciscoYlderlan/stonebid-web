import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { formatDateTime } from '@/lib/time'

import { useAuctioneerLots } from '../hooks/useAuctioneerLots'
import type { CatalogItem, Lot } from '../types/lot-types'
import { AuctioneerLots, type LotHighlight } from './auctioneer-lots'
import { CreateLotDialog } from './create-lot-dialog'
import { ItemSearch } from './item-search'

/** Quanto tempo o card do lote recém-criado fica realçado. */
const HIGHLIGHT_MS = 2500
/** O aviso de sucesso fica o bastante para o leiloeiro ler e usar "Ver lote". */
const CREATED_TOAST_MS = 8000

/** Painel do leiloeiro: busca no acervo, criação de lote e "Meus lotes". */
export function AuctioneerPanel() {
  const [selected, setSelected] = useState<CatalogItem | null>(null)
  const [highlight, setHighlight] = useState<LotHighlight | null>(null)
  // Lote a mostrar quando o diálogo terminar de fechar (sem a trava de rolagem dele).
  const pendingReveal = useRef<string | null>(null)
  const revealCount = useRef(0)
  const highlightTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // Mesma consulta de "Meus lotes" (em cache): dá a hora do servidor para validar o início.
  const { data } = useAuctioneerLots()

  useEffect(() => () => clearTimeout(highlightTimer.current), [])

  /** Rola até o card do lote, põe o foco nele e o realça por alguns segundos. */
  const reveal = useCallback((lotId: string) => {
    revealCount.current += 1
    setHighlight({ lotId, nonce: revealCount.current })
    clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(() => setHighlight(null), HIGHLIGHT_MS)
  }, [])

  function handleCreated(lot: Lot) {
    pendingReveal.current = lot.id
    setSelected(null)
    toast.success(`Lote “${lot.title}” criado`, {
      description: `Começa em ${formatDateTime(lot.startsAt)}.`,
      duration: CREATED_TOAST_MS,
      action: { label: 'Ver lote', onClick: () => reveal(lot.id) },
    })
  }

  function handleCloseAutoFocus(event: Event) {
    const lotId = pendingReveal.current
    if (!lotId) return // fechou sem criar: o foco volta ao botão da busca
    pendingReveal.current = null
    event.preventDefault() // o foco vai para o card novo, não para a busca
    reveal(lotId)
  }

  return (
    <div className="space-y-12">
      <ItemSearch onSelect={setSelected} />
      <AuctioneerLots highlight={highlight} />
      <CreateLotDialog
        item={selected}
        clockOffsetMs={data?.clockOffsetMs ?? 0}
        onClose={() => setSelected(null)}
        onCreated={handleCreated}
        onCloseAutoFocus={handleCloseAutoFocus}
      />
    </div>
  )
}
