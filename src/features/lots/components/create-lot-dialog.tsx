import { CoverImage } from '@/components/common/cover-image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiUrl } from '@/lib/api-client'

import type { CatalogItem, Lot } from '../types/lot-types'
import { CreateLotForm } from './create-lot-form'

type CreateLotDialogProps = {
  /** Item escolhido na busca; `null` fecha o diálogo. */
  item: CatalogItem | null
  clockOffsetMs: number
  onClose: () => void
  /** Lote criado; quem chama fecha o diálogo. No erro, o diálogo fica aberto com os dados. */
  onCreated: (lot: Lot) => void
  /** Depois de fechar (animação e trava de rolagem já desfeitas): quem chama decide o foco. */
  onCloseAutoFocus?: (event: Event) => void
}

export function CreateLotDialog({
  item,
  clockOffsetMs,
  onClose,
  onCreated,
  onCloseAutoFocus,
}: CreateLotDialogProps) {
  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-xl"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {item ? (
          <>
            <DialogHeader>
              <DialogTitle>Novo lote</DialogTitle>
              <DialogDescription>
                Imagem, título e atributos são copiados do item e ficam
                guardados no lote.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-3">
              <CoverImage
                src={item.imageUrl ? apiUrl(item.imageUrl) : null}
                alt={item.title}
                className="w-20 shrink-0 rounded-md"
              />
              <p className="line-clamp-2 font-medium">{item.title}</p>
            </div>
            <CreateLotForm
              key={item.externalId}
              item={item}
              clockOffsetMs={clockOffsetMs}
              onCreated={onCreated}
            />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
