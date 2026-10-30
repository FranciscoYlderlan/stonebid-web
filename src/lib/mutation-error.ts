import { toast } from 'sonner'

import { ApiError } from '@/lib/api-client'

/** Mensagem para qualquer falha que não seja um erro da API (resposta fora do formato, bug). */
export const GENERIC_MUTATION_ERROR =
  'Algo deu errado. Tente de novo em instantes.'

/**
 * Texto que o usuário vê quando uma mutação falha. Só o `ApiError` traz mensagem pensada
 * para o usuário (vinda da API ou da falha de rede no `api-client`); qualquer outro erro,
 * como o `ZodError` de uma resposta fora do contrato, vira a mensagem genérica.
 */
export function getMutationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  console.error(error)
  return GENERIC_MUTATION_ERROR
}

/** `onError` padrão das mutações: toast com a mensagem tratada. */
export function showMutationError(error: unknown) {
  toast.error(getMutationErrorMessage(error))
}
