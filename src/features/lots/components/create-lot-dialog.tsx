import { CoverImage } from '@/components/common/cover-image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type { CatalogItem } from '../types/lot-types'
import { CreateLotForm } from './create-lot-form'

type CreateLotDialogProps = {
  /** Item escolhido na busca; `null` fecha o diálogo. */
  item: CatalogItem | null
  clockOffsetMs: number
  onClose: () => void
}

export function CreateLotDialog({
  item,
  clockOffsetMs,
  onClose,
}: CreateLotDialogProps) {
  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
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
                src={item.imageUrl}
                alt={item.title}
                className="w-20 shrink-0 rounded-md"
              />
              <p className="line-clamp-2 font-medium">{item.title}</p>
            </div>
            <CreateLotForm
              key={item.externalId}
              item={item}
              clockOffsetMs={clockOffsetMs}
              onCreated={onClose}
            />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
