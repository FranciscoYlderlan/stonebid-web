import { type FormEvent, useRef } from 'react'
import { toast } from 'sonner'

import { SubmitButton } from '@/components/common/submit-button'
import { TextField } from '@/components/common/text-field'
import { useServerNow } from '@/hooks/useServerNow'
import { useZodForm } from '@/hooks/useZodForm'
import { isApiError } from '@/lib/api-client'
import { centsToReaisInput, formatCents } from '@/lib/money'
import { showMutationError } from '@/lib/mutation-error'

import { useLot } from '../hooks/useLot'
import { usePlaceBid } from '../hooks/usePlaceBid'
import {
  BID_BELOW_MINIMUM,
  bidBelowMinimumDetailsSchema,
  bidFormSchema,
} from '../schemas/bid-schemas'

/**
 * Lance do licitante (RF-33). Mesmo padrão do depósito (RN-18): a `Idempotency-Key` vale
 * para um valor até o lance dar certo, então a nova tentativa depois de uma falha reusa a
 * chave e não grava dois lances; chave nova só depois do sucesso ou se o valor mudar. O
 * botão trava enquanto a requisição está no ar. Recusa da API aparece com a mensagem dela.
 * Fora do ao vivo (ou com a contagem zerada, antes de o servidor encerrar) o formulário
 * fica desabilitado.
 */
export function BidPanel({ id }: { id: string }) {
  const { data } = useLot(id)
  const nowMs = useServerNow(data?.clockOffsetMs ?? 0)
  const minNextBidCents = data?.lot.minNextBidCents
  const open =
    data?.lot.status === 'LIVE' && nowMs < Date.parse(data.lot.endsAt)
  const form = useZodForm(bidFormSchema, {
    amount:
      minNextBidCents === undefined ? '' : centsToReaisInput(minNextBidCents),
  })
  const placeBid = usePlaceBid()
  // Trava síncrona: o segundo clique pode chegar antes de o botão re-renderizar desabilitado.
  const inFlight = useRef(false)
  // Chave da tentativa em aberto, presa ao valor em centavos que ela oferece.
  const pendingKey = useRef<{ amountCents: number; key: string } | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current || !open) return
    const values = form.validate()
    if (!values) return

    if (pendingKey.current?.amountCents !== values.amount) {
      pendingKey.current = {
        amountCents: values.amount,
        key: crypto.randomUUID(),
      }
    }

    inFlight.current = true
    placeBid.mutate(
      {
        lotId: id,
        amountCents: values.amount,
        idempotencyKey: pendingKey.current.key,
      },
      {
        onSuccess: ({ bid, lot }) => {
          pendingKey.current = null
          toast.success(`Lance de ${formatCents(bid.amountCents)} registrado.`)
          form.setValue('amount', centsToReaisInput(lot.minNextBidCents))
        },
        onError: (error) => {
          showMutationError(error)
          // Abaixo do mínimo: o campo passa a sugerir o mínimo que o servidor informou.
          const details = isApiError(error, BID_BELOW_MINIMUM)
            ? bidBelowMinimumDetailsSchema.parse(error.details)
            : null
          if (details)
            form.setValue('amount', centsToReaisInput(details.minAmountCents))
        },
        onSettled: () => {
          inFlight.current = false
        },
      },
    )
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Dar lance"
      className="space-y-3"
    >
      <TextField
        id="bid-amount"
        disabled={!open}
        label="Seu lance (R$)"
        inputMode="decimal"
        className="h-10"
        placeholder={
          minNextBidCents === undefined
            ? '100,00'
            : centsToReaisInput(minNextBidCents)
        }
        aria-describedby="bid-minimum"
        value={form.values.amount}
        error={form.errors.amount}
        onChange={(event) => form.setValue('amount', event.target.value)}
      />
      {minNextBidCents === undefined ? null : (
        <p id="bid-minimum" className="text-sm text-muted-foreground">
          Lance mínimo agora:{' '}
          <span
            className="font-medium text-foreground tabular-nums"
            data-testid="bid-minimum"
          >
            {formatCents(minNextBidCents)}
          </span>
        </p>
      )}
      <SubmitButton
        pending={placeBid.isPending}
        disabled={!open}
        className="h-10 w-full"
      >
        Dar lance
      </SubmitButton>
      {open ? null : (
        <p className="text-sm text-muted-foreground" data-testid="bid-closed">
          Os lances estão fechados neste momento.
        </p>
      )}
    </form>
  )
}
