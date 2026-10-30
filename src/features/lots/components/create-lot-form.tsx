import { Link } from '@tanstack/react-router'
import { Ban } from 'lucide-react'
import type { FormEvent } from 'react'
import { useId, useMemo, useState } from 'react'

import { SubmitButton } from '@/components/common/submit-button'
import { TextField } from '@/components/common/text-field'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { FieldGroup } from '@/components/ui/field'
import { useZodForm } from '@/hooks/useZodForm'
import { isApiError } from '@/lib/api-client'
import { showMutationError } from '@/lib/mutation-error'
import { serverNowMs, toDateTimeLocalValue } from '@/lib/time'

import { useCreateLot } from '../hooks/useCreateLot'
import {
  createLotFormSchema,
  ITEM_ALREADY_AUCTIONED,
  ITEM_AUCTION_REASONS,
  itemAlreadyAuctionedDetailsSchema,
} from '../schemas/lot-schemas'
import type { CatalogItem, ItemAuction, Lot } from '../types/lot-types'

/** Obra bloqueada pela RN-19; `auction` é `null` quando o 409 veio sem `details` válidos. */
type Blocked = { auction: ItemAuction | null }

const DEFAULT_START_IN_MS = 10 * 60_000
const DEFAULT_DURATION_MS = 60 * 60_000

type CreateLotFormProps = {
  item: CatalogItem
  /** Deslocamento do relógio do servidor (da lista "Meus lotes"). */
  clockOffsetMs: number
  onCreated: (lot: Lot) => void
  /** 409 `ITEM_ALREADY_AUCTIONED`: outro lote tomou a obra entre a busca e o envio. */
  onAuctionFound?: (auction: ItemAuction) => void
}

/** Lance inicial e incremento em reais, início e fim; valida como o servidor (RF-21). */
export function CreateLotForm({
  item,
  clockOffsetMs,
  onCreated,
  onAuctionFound,
}: CreateLotFormProps) {
  const blockedId = useId()
  const [blocked, setBlocked] = useState<Blocked | null>(
    item.auction ? { auction: item.auction } : null,
  )
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
    if (createLot.isPending || blocked) return
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
        onError: (error) => {
          if (!isApiError(error, ITEM_ALREADY_AUCTIONED))
            return showMutationError(error)
          // Nunca a mensagem crua: o texto e o link saem do `details`.
          const auction = itemAlreadyAuctionedDetailsSchema.parse(error.details)
          setBlocked({ auction })
          if (auction) onAuctionFound?.(auction)
        },
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
        {blocked ? (
          <Alert
            variant="destructive"
            id={blockedId}
            data-testid="item-already-auctioned"
          >
            <Ban aria-hidden />
            <AlertTitle>Não dá para criar outro lote desta obra</AlertTitle>
            <AlertDescription>
              <p>
                {blocked.auction
                  ? ITEM_AUCTION_REASONS[blocked.auction.status]
                  : 'Esta obra já está em leilão ou foi vendida. Uma obra só pode estar em um lote por vez.'}
              </p>
              {blocked.auction ? (
                <Link
                  to="/lots/$id"
                  params={{ id: blocked.auction.lotId }}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Ver o lote
                </Link>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}
        <SubmitButton
          pending={createLot.isPending}
          disabled={blocked !== null}
          aria-describedby={blocked ? blockedId : undefined}
          size="lg"
        >
          {createLot.isPending ? 'Criando lote…' : 'Criar lote'}
        </SubmitButton>
      </FieldGroup>
    </form>
  )
}
