import { useQuery } from '@tanstack/react-query'

import { sessionQueryOptions } from '../api/auth-api'

export function useSession() {
  const { data: user = null, isPending } = useQuery(sessionQueryOptions())
  return { user, isPending }
}
