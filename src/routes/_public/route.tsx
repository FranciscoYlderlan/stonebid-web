import { createFileRoute, Outlet } from '@tanstack/react-router'

import { PublicShell } from '@/components/layout/public-shell'

// Acesso livre (RF-03): este layout nunca lê a sessão nem redireciona.
export const Route = createFileRoute('/_public')({
  component: () => (
    <PublicShell>
      <Outlet />
    </PublicShell>
  ),
})
