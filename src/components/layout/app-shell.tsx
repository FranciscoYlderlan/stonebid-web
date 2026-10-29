import type { ReactNode } from 'react'

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import type { NavItem } from '@/config/navigation'

import { AppSidebar } from './app-sidebar'

/** Shell das rotas protegidas: sidebar + conteúdo, abaixo do Header. */
export function AppShell({
  navItems,
  children,
}: {
  navItems: readonly NavItem[]
  children: ReactNode
}) {
  return (
    <SidebarProvider className="min-h-[calc(100svh-var(--header-height))]">
      <AppSidebar items={navItems} />
      <SidebarInset>
        <div className="px-4 pt-4 md:hidden">
          <SidebarTrigger aria-label="Abrir menu" />
        </div>
        <div className="w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
