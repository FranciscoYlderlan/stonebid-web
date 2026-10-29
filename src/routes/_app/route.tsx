import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { AppShell } from '@/components/layout/app-shell'
import { APP_NAV_ITEMS } from '@/config/navigation'

// Guard: sem login → /login?redirect=<url atual>. A proteção real é do servidor (RF-02).
export const Route = createFileRoute('/_app')({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { user: context.user }
  },
  component: () => (
    <AppShell navItems={APP_NAV_ITEMS}>
      <Outlet />
    </AppShell>
  ),
})
