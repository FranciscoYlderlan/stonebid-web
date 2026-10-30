import { type FormEvent, useMemo, useRef } from 'react'
import { toast } from 'sonner'

import { SubmitButton } from '@/components/common/submit-button'
import { TextField } from '@/components/common/text-field'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useZodForm } from '@/hooks/useZodForm'
import { formatCents } from '@/lib/money'
import { showMutationError } from '@/lib/mutation-error'

import { useDeposit } from '../hooks/useDeposit'
import { createDepositFormSchema } from '../schemas/wallet-schemas'

/**
 * Depósito simulado (RF-41). A `Idempotency-Key` vale para um valor até o depósito dar
 * certo: nova tentativa depois de falha (ex.: rede caiu com o depósito já gravado) reusa
 * a chave e não deposita duas vezes. Chave nova só depois do sucesso ou se o valor mudar.
 * O botão fica travado enquanto a requisição está no ar (RN-18).
 */
export function DepositForm({
  depositLimitCents,
}: {
  depositLimitCents: number
}) {
  const schema = useMemo(
    () => createDepositFormSchema(depositLimitCents),
    [depositLimitCents],
  )
  const form = useZodForm(schema, { amount: '' })
  const deposit = useDeposit()
  // Trava síncrona: o segundo clique pode chegar antes de o botão re-renderizar desabilitado.
  const inFlight = useRef(false)
  // Chave da tentativa em aberto, presa ao valor em centavos que ela deposita.
  const pendingKey = useRef<{ amountCents: number; key: string } | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    const data = form.validate()
    if (!data) return

    if (pendingKey.current?.amountCents !== data.amount) {
      pendingKey.current = {
        amountCents: data.amount,
        key: crypto.randomUUID(),
      }
    }

    inFlight.current = true
    deposit.mutate(
      { amountCents: data.amount, idempotencyKey: pendingKey.current.key },
      {
        onSuccess: ({ movement }) => {
          pendingKey.current = null
          toast.success(
            `Depósito de ${formatCents(movement.amountCents)} feito.`,
          )
          form.setValue('amount', '')
        },
        onError: showMutationError,
        onSettled: () => {
          inFlight.current = false
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Depositar</CardTitle>
        <CardDescription>
          Saldo simulado, para dar lances. Máximo de{' '}
          {formatCents(depositLimitCents)} por depósito.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          onSubmit={handleSubmit}
          aria-label="Depositar"
          className="flex flex-col gap-3 sm:flex-row sm:items-start"
        >
          <div className="flex-1">
            <TextField
              id="amount"
              label="Valor (R$)"
              inputMode="decimal"
              placeholder="100,00"
              value={form.values.amount}
              error={form.errors.amount}
              onChange={(event) => form.setValue('amount', event.target.value)}
            />
          </div>
          <SubmitButton pending={deposit.isPending} className="sm:mt-6">
            Depositar
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  )
}
