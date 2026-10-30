import { queryOptions } from '@tanstack/react-query'

import { apiClient, isApiError } from '@/lib/api-client'

import { auditResponseSchema } from '../schemas/audit-schemas'
import type { Audit } from '../types/audit-types'

export const auditKeys = {
  all: ['audit'] as const,
  detail: (lotId: string) => [...auditKeys.all, lotId] as const,
}

/**
 * Auditoria pública do lote (RF-60): o veredito é recalculado pela API a cada acesso, então
 * nada fica em cache. Cada montagem da página e cada "Verificar de novo" refazem a consulta.
 */
export const auditQueryOptions = (lotId: string) =>
  queryOptions({
    queryKey: auditKeys.detail(lotId),
    // Sem `signal` de propósito: uma consulta em andamento não é cancelada quando a tela
    // desmonta e remonta (StrictMode), então cada acesso faz uma chamada só.
    queryFn: async (): Promise<Audit> =>
      auditResponseSchema.parse(
        await apiClient.get<unknown>(
          `/lots/${encodeURIComponent(lotId)}/audit`,
        ),
      ),
    // Sempre velha: toda montagem da página consulta de novo (o padrão `refetchOnMount`).
    staleTime: 0,
    // Lote inexistente: 404 já, sem novas tentativas (nem ao remontar a tela).
    retryOnMount: false,
    retry: (failureCount, error) =>
      !(isApiError(error) && error.status < 500) && failureCount < 2,
  })
