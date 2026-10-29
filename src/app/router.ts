import { createRouter } from '@tanstack/react-router'

import { createAuthContext } from '@/features/auth'
import { createQueryClient } from '@/lib/query-client'
import { routeTree } from '@/routes/routeTree.gen'

export const queryClient = createQueryClient()

export const router = createRouter({
  routeTree,
  context: { queryClient, auth: createAuthContext(queryClient) },
  defaultPreload: 'intent',
  // O cache é do TanStack Query: o router não guarda cópia própria.
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
