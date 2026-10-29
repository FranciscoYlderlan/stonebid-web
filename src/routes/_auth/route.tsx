import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { AuthShell } from '@/components/layout/auth-shell'
import { authSearchSchema } from '@/features/auth'

// Só para quem NÃO entrou: logado volta para o ?redirect (caminho interno) ou para /.
export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context, location }) => {
    if (!context.user) return
    const { redirect: target } = authSearchSchema.parse(location.search)
    throw redirect({ href: target ?? '/' })
  },
  component: () => (
    <AuthShell>
      <Outlet />
    </AuthShell>
  ),
})
