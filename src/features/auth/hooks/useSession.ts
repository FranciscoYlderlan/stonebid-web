import { useQuery } from '@tanstack/react-query'

import { sessionQueryOptions } from '../api/auth-api'

/**
 * Sessão atual. `error` só existe quando o `GET /auth/me` falhou por motivo que não é
 * 401 (rede, 5xx, resposta fora do contrato): o 401 já vira visitante (`user` null).
 */
export function useSession() {
  const {
    data: user = null,
    isPending,
    error,
  } = useQuery(sessionQueryOptions())
  return { user, isPending, error }
}
