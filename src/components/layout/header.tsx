import type { ReactNode } from 'react'

import { BrandLogo } from '@/components/common/brand-logo'
import { ThemeToggle } from '@/components/common/theme-toggle'

/** Cabeçalho único de todas as telas; o lado direito vem de fora (`actions`). */
export function Header({ actions }: { actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 h-(--header-height) border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4">
        <BrandLogo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {actions}
        </div>
      </div>
    </header>
  )
}
