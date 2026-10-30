import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { AppShell } from '@/components/layout/app-shell'
import { navItemsFor } from '@/config/navigation'

// Guard: sem login → /login?redirect=<url atual>. A proteção real é do servidor (RF-02).
export const Route = createFileRoute('/_app')({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { user: context.user }
  },
  component: AppLayout,
})

// Links da sidebar conforme o papel; a proteção real continua no servidor (RF-02).
function AppLayout() {
  const { user } = Route.useRouteContext()
  return (
    <AppShell navItems={navItemsFor(user.role)}>
      <Outlet />
    </AppShell>
  )
}
