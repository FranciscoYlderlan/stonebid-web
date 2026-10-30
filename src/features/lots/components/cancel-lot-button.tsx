import { useQuery } from '@tanstack/react-query'
import { Ban } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { TextField } from '@/components/common/text-field'
import {
  AlertDialog,
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
import { useZodForm } from '@/hooks/useZodForm'
import { formatCents } from '@/lib/money'
import { getMutationErrorMessage } from '@/lib/mutation-error'

import { bidHistoryQueryOptions } from '../api/lots-api'
import { useCancelLot } from '../hooks/useCancelLot'
import { CANCEL_REASON_MAX, cancelLotFormSchema } from '../schemas/lot-schemas'
import type { Lot } from '../types/lot-types'

/** "1 lance" / "N lances". */
const bidsLabel = (count: number) =>
  `${count} ${count === 1 ? 'lance' : 'lances'}`

/**
 * O que o cancelamento faz com o dinheiro (OPC-2): sem lance, nada; com lance, o líder recebe
 * estorno do lance atual na mesma transação, e os superados já tinham sido liberados. A
 * contagem vem do histórico público, lido só com o diálogo aberto; até chegar, só o valor.
 */
function RefundNotice({
  lot,
  open,
}: {
  lot: Pick<Lot, 'id' | 'currentBidCents'>
  open: boolean
}) {
  const hasBids = lot.currentBidCents !== null
  const { data: bids } = useQuery({
    ...bidHistoryQueryOptions(lot.id),
    enabled: open && hasBids,
  })

  if (lot.currentBidCents === null) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="cancel-refund">
        Sem lances: ninguém recebe estorno.
      </p>
    )
  }

  const refund = formatCents(lot.currentBidCents)
  return (
    <p
      className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
      role="note"
      data-testid="cancel-refund"
    >
      {bids && bids.length > 0
        ? `${bidsLabel(bids.length)}; o líder recebe estorno de ${refund}.`
        : `O líder recebe estorno de ${refund}.`}
    </p>
  )
}

/**
 * Cancelar com confirmação e motivo obrigatório (RF-22). O motivo é validado aqui como no
 * servidor (3 a 280 caracteres); a recusa da API (422, 409) aparece no próprio diálogo. Com
 * lances, o diálogo avisa o estorno do líder (OPC-2).
 */
export function CancelLotButton({
  lot,
}: {
  lot: Pick<Lot, 'id' | 'title' | 'currentBidCents'>
}) {
  const [open, setOpen] = useState(false)
  const cancelLot = useCancelLot()
  const form = useZodForm(cancelLotFormSchema, { reason: '' })
  const [apiError, setApiError] = useState<string | null>(null)
  const fieldId = useId()
  const reason = form.values.reason ?? ''

  function handleOpenChange(next: boolean) {
    if (cancelLot.isPending) return
    setOpen(next)
    if (!next) {
      form.setValue('reason', '')
      setApiError(null)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (cancelLot.isPending) return
    const data = form.validate()
    if (!data) return
    setApiError(null)
    cancelLot.mutate(
      { id: lot.id, reason: data.reason },
      {
        onSuccess: () => {
          toast.success('Lote cancelado.')
          handleOpenChange(false)
        },
        onError: (error) => setApiError(getMutationErrorMessage(error)),
      },
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Ban data-icon="inline-start" aria-hidden />
          Cancelar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form onSubmit={submit} noValidate className="grid gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar este lote?</AlertDialogTitle>
            <AlertDialogDescription>
              “{lot.title}” sai da vitrine e não aceita mais lances. O motivo
              fica visível no lote.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <RefundNotice lot={lot} open={open} />
          <TextField
            id={fieldId}
            label="Motivo do cancelamento"
            value={reason}
            onChange={(event) => {
              form.setValue('reason', event.target.value)
              setApiError(null)
            }}
            error={form.errors.reason ?? apiError ?? undefined}
            placeholder="Ex.: obra retirada pelo comitente"
            autoComplete="off"
            aria-describedby={`${fieldId}-count`}
          />
          <p
            id={`${fieldId}-count`}
            className="-mt-2 text-right text-xs text-muted-foreground tabular-nums"
          >
            {reason.trim().length}/{CANCEL_REASON_MAX}
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLot.isPending}>
              Voltar
            </AlertDialogCancel>
            <Button
              type="submit"
              variant="destructive"
              disabled={cancelLot.isPending}
            >
              {cancelLot.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              Cancelar lote
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
