import { queryOptions, type QueryClient } from '@tanstack/react-query'

import { apiClient, isApiError } from '@/lib/api-client'
import {
  clearSessionToken,
  getSessionToken,
  setSessionToken,
} from '@/lib/session-token'

import { authResponseSchema, meResponseSchema } from '../schemas/auth-schemas'
import type {
  AuthContext,
  LoginInput,
  RegisterInput,
  User,
} from '../types/auth-types'

export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
}

async function fetchSession(signal?: AbortSignal): Promise<User | null> {
  if (!getSessionToken()) return null
  try {
    const data = await apiClient.get<unknown>('/auth/me', { signal })
    return meResponseSchema.parse(data).user
  } catch (error) {
    // 401 em /auth/me = visitante, não erro.
    if (isApiError(error) && error.status === 401) return null
    throw error
  }
}

export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.session(),
    queryFn: ({ signal }) => fetchSession(signal),
    staleTime: Infinity,
    // O beforeLoad da raiz já tentou (com as novas tentativas padrão): o componente que
    // monta depois não refaz a busca, e o aviso de falha fica parado na tela.
    retryOnMount: false,
  })

async function authenticate(path: string, body: unknown): Promise<User> {
  const data = await apiClient.post<unknown>(path, body)
  const { user, token } = authResponseSchema.parse(data)
  setSessionToken(token)
  return user
}

export const loginRequest = (input: LoginInput) =>
  authenticate('/auth/login', input)

export const registerRequest = (input: RegisterInput) =>
  authenticate('/auth/register', input)

export function startSession(queryClient: QueryClient, user: User) {
  queryClient.setQueryData(authKeys.session(), user)
}

export function endSession(queryClient: QueryClient) {
  clearSessionToken()
  queryClient.setQueryData(authKeys.session(), null)
}

export function createAuthContext(queryClient: QueryClient): AuthContext {
  return {
    // Falha de rede ao ler a sessão não derruba as páginas públicas: vira visitante, com
    // o aviso do SessionCheckAlert (o erro fica na query) e sem apagar o token salvo.
    getSession: () =>
      queryClient.ensureQueryData(sessionQueryOptions()).catch(() => null),
  }
}
