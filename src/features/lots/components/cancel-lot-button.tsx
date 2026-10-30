import { Ban } from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import { useCancelLot } from '../hooks/useCancelLot'
import type { Lot } from '../types/lot-types'

/** Cancelar com confirmação (RF-22). O servidor decide; a recusa (409) mostra o motivo. */
export function CancelLotButton({ lot }: { lot: Pick<Lot, 'id' | 'title'> }) {
  const cancelLot = useCancelLot()

  function confirm() {
    if (cancelLot.isPending) return
    cancelLot.mutate(lot.id, {
      onSuccess: () => toast.success('Lote cancelado.'),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={cancelLot.isPending}>
          {cancelLot.isPending ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Ban data-icon="inline-start" aria-hidden />
          )}
          Cancelar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar este lote?</AlertDialogTitle>
          <AlertDialogDescription>
            “{lot.title}” sai da vitrine. Só é possível cancelar um lote que
            ainda não recebeu lances.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirm}>
            Cancelar lote
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
