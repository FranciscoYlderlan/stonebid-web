import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'

import { endSession } from '../api/auth-api'

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useCallback(async () => {
    endSession(queryClient)
    await router.navigate({ to: '/' })
    await router.invalidate()
  }, [queryClient, router])
}
