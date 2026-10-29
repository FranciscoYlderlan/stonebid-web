import { RouterProvider } from '@tanstack/react-router'
import { useEffect } from 'react'

import { endSession } from '@/features/auth'
import { setUnauthorizedHandler } from '@/lib/api-client'

import { AppProviders } from './providers/app-providers'
import { queryClient, router } from './router'

export function App() {
  useEffect(() => {
    // 401 em qualquer chamada autenticada: limpa a sessão e reavalia os guards.
    setUnauthorizedHandler(() => {
      endSession(queryClient)
      void router.invalidate()
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  return (
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
