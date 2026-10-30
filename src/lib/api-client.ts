import { env } from '@/config/env'
import { clearSessionToken, getSessionToken } from '@/lib/session-token'

/** Erro no formato da API: `{ error: { code, message, details? } }`. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  /** Dados extras de alguns erros (ex.: `{ status, lotId }` do `ITEM_ALREADY_AUCTIONED`); quem usa valida. */
  readonly details: unknown

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function isApiError(error: unknown, code?: string): error is ApiError {
  return (
    error instanceof ApiError && (code === undefined || error.code === code)
  )
}

type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null

/** Quem monta a aplicação decide o que fazer quando a sessão expira (401). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  /** Cabeçalhos extras (ex.: `Idempotency-Key`). */
  headers?: Record<string, string>
}

/** URL absoluta de um caminho da API (ex.: `imageUrl` relativo, `/lots/{id}/image`). */
export function apiUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${env.apiUrl}${path}`
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const data: unknown = await response.json()
    const error = (
      data as {
        error?: { code?: unknown; message?: unknown; details?: unknown }
      }
    )?.error
    if (typeof error?.code === 'string' && typeof error.message === 'string') {
      return new ApiError(
        response.status,
        error.code,
        error.message,
        error.details,
      )
    }
  } catch {
    // Corpo vazio ou fora do formato: cai na mensagem genérica.
  }
  return new ApiError(
    response.status,
    'UNKNOWN_ERROR',
    'Algo deu errado. Tente de novo em instantes.',
  )
}

async function request<T>(
  path: string,
  { method = 'GET', body, signal, headers: extraHeaders }: RequestOptions = {},
): Promise<T> {
  const token = getSessionToken()
  const headers = new Headers({ ...extraHeaders, Accept: 'application/json' })
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(apiUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Não foi possível conectar ao servidor. Verifique sua conexão.',
    )
  }

  if (!response.ok) {
    const error = await parseError(response)
    // 401 com token enviado = sessão inválida ou expirada.
    if (response.status === 401 && token) {
      clearSessionToken()
      onUnauthorized?.()
    }
    throw error
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => request<T>(path, { ...options, method: 'POST', body }),
}
