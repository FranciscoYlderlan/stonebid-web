import type { LinkProps } from '@tanstack/react-router'
import { Gavel, UserRound, Wallet, type LucideIcon } from 'lucide-react'

/** Papéis da conta, como a API devolve (RF-01). */
type NavRole = 'AUCTIONEER' | 'BIDDER'

export type NavItem = {
  to: NonNullable<LinkProps['to']>
  label: string
  icon: LucideIcon
  /** Só estes papéis veem o item; sem `roles`, todos veem. */
  roles?: readonly NavRole[]
}

/** Itens da sidebar da área logada. Cada incremento acrescenta os seus. */
export const APP_NAV_ITEMS = [
  {
    to: '/auctioneer',
    label: 'Painel do leiloeiro',
    icon: Gavel,
    roles: ['AUCTIONEER'],
  },
  { to: '/wallet', label: 'Carteira', icon: Wallet, roles: ['BIDDER'] },
  { to: '/account', label: 'Minha conta', icon: UserRound },
] as const satisfies readonly NavItem[]

export function navItemsFor(role: NavRole): readonly NavItem[] {
  return APP_NAV_ITEMS.filter(
    (item: NavItem) => !item.roles || item.roles.includes(role),
  )
}
