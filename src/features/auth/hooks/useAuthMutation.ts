import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { startSession } from '../api/auth-api'
import type { User } from '../types/auth-types'

export type AuthMutationOptions = { onSuccess?: (user: User) => void }

/** Login e cadastro terminam igual: guarda a sessão, reavalia os guards e avisa quem chamou. */
export function useAuthMutation<TInput>(
  request: (input: TInput) => Promise<User>,
  options: AuthMutationOptions = {},
) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: request,
    onSuccess: async (user) => {
      startSession(queryClient, user)
      await router.invalidate()
      options.onSuccess?.(user)
    },
  })
}
