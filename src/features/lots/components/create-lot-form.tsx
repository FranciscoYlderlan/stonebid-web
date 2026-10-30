import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'

import { SubmitButton } from '@/components/common/submit-button'
import { TextField } from '@/components/common/text-field'
import { FieldGroup } from '@/components/ui/field'
import { useZodForm } from '@/hooks/useZodForm'
import { showMutationError } from '@/lib/mutation-error'
import { serverNowMs, toDateTimeLocalValue } from '@/lib/time'

import { useCreateLot } from '../hooks/useCreateLot'
import { createLotFormSchema } from '../schemas/lot-schemas'
import type { CatalogItem, Lot } from '../types/lot-types'

const DEFAULT_START_IN_MS = 10 * 60_000
const DEFAULT_DURATION_MS = 60 * 60_000

type CreateLotFormProps = {
  item: CatalogItem
  /** Deslocamento do relógio do servidor (da lista "Meus lotes"). */
  clockOffsetMs: number
  onCreated: (lot: Lot) => void
}

/** Lance inicial e incremento em reais, início e fim; valida como o servidor (RF-21). */
export function CreateLotForm({
  item,
  clockOffsetMs,
  onCreated,
}: CreateLotFormProps) {
  const schema = useMemo(
    () => createLotFormSchema(() => serverNowMs(clockOffsetMs)),
    [clockOffsetMs],
  )
  // Sugestão: começa em 10 minutos e dura 1 hora (hora do servidor).
  const [initialValues] = useState(() => {
    const start = new Date(serverNowMs(clockOffsetMs) + DEFAULT_START_IN_MS)
    return {
      startingBid: '',
      minIncrement: '',
      startsAt: toDateTimeLocalValue(start),
      endsAt: toDateTimeLocalValue(
        new Date(start.getTime() + DEFAULT_DURATION_MS),
      ),
    }
  })
  const form = useZodForm(schema, initialValues)
  const createLot = useCreateLot()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (createLot.isPending) return
    const data = form.validate()
    if (!data) return
    createLot.mutate(
      {
        externalId: item.externalId,
        startingBidCents: data.startingBid,
        minIncrementCents: data.minIncrement,
        startsAt: data.startsAt.toISOString(),
        endsAt: data.endsAt.toISOString(),
      },
      {
        // O aviso de sucesso e o destaque do card ficam com o painel (onCreated).
        onSuccess: onCreated,
        onError: showMutationError,
      },
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} aria-label="Criar lote">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="startingBid"
            label="Lance inicial (R$)"
            inputMode="decimal"
            placeholder="150,00"
            value={form.values.startingBid}
            error={form.errors.startingBid}
            onChange={(event) =>
              form.setValue('startingBid', event.target.value)
            }
          />
          <TextField
            id="minIncrement"
            label="Incremento mínimo (R$)"
            inputMode="decimal"
            placeholder="10,00"
            value={form.values.minIncrement}
            error={form.errors.minIncrement}
            onChange={(event) =>
              form.setValue('minIncrement', event.target.value)
            }
          />
          <TextField
            id="startsAt"
            label="Início"
            type="datetime-local"
            value={form.values.startsAt}
            error={form.errors.startsAt}
            onChange={(event) => form.setValue('startsAt', event.target.value)}
          />
          <TextField
            id="endsAt"
            label="Fim"
            type="datetime-local"
            value={form.values.endsAt}
            error={form.errors.endsAt}
            onChange={(event) => form.setValue('endsAt', event.target.value)}
          />
        </div>
        <SubmitButton pending={createLot.isPending} size="lg">
          {createLot.isPending ? 'Criando lote…' : 'Criar lote'}
        </SubmitButton>
      </FieldGroup>
    </form>
  )
}
