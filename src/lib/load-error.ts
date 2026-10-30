import { ApiError } from '@/lib/api-client'

/** Mensagem para qualquer falha de carregamento que não seja um erro da API. */
export const GENERIC_LOAD_ERROR =
  'Não foi possível carregar os dados. Tente de novo.'

/**
 * Texto que o usuário vê quando uma tela não consegue carregar. Mesmo critério das
 * mutações (`getMutationErrorMessage`): só o `ApiError` traz mensagem pensada para o
 * usuário; qualquer outro erro, como o `ZodError` de uma resposta fora do contrato,
 * vira a mensagem genérica em português e vai só para o console.
 */
export function getLoadErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.message) return error.message
  console.error(error)
  return GENERIC_LOAD_ERROR
}
