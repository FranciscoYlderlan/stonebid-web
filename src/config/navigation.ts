import type { LinkProps } from '@tanstack/react-router'
import { UserRound, type LucideIcon } from 'lucide-react'

export type NavItem = {
  to: NonNullable<LinkProps['to']>
  label: string
  icon: LucideIcon
}

/** Itens da sidebar da área logada. Cada incremento acrescenta os seus. */
export const APP_NAV_ITEMS = [
  { to: '/account', label: 'Minha conta', icon: UserRound },
] as const satisfies readonly NavItem[]
