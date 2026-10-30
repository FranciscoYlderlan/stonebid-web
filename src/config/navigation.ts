import type { LinkProps } from '@tanstack/react-router'
import { Gavel, Trophy, UserRound, Wallet, type LucideIcon } from 'lucide-react'

/** Papéis da conta, como a API devolve (RF-01). */
type NavRole = 'AUCTIONEER' | 'BIDDER'

export type NavItem = {
  to: NonNullable<LinkProps['to']>
  label: string
  icon: LucideIcon
  /** Só estes papéis veem o item; sem `roles`, todos veem. */
  roles?: readonly NavRole[]
  /** Área principal do papel: vira o atalho do cabeçalho (um por papel). */
  roleArea?: true
}

/** Itens da sidebar da área logada. Cada incremento acrescenta os seus. */
export const APP_NAV_ITEMS = [
  {
    to: '/auctioneer',
    label: 'Painel do leiloeiro',
    icon: Gavel,
    roles: ['AUCTIONEER'],
    roleArea: true,
  },
  {
    to: '/wallet',
    label: 'Carteira',
    icon: Wallet,
    roles: ['BIDDER'],
    roleArea: true,
  },
  {
    to: '/my-bids',
    label: 'Meus arremates',
    icon: Trophy,
    roles: ['BIDDER'],
  },
  { to: '/account', label: 'Minha conta', icon: UserRound },
] as const satisfies readonly NavItem[]

export function navItemsFor(role: NavRole): readonly NavItem[] {
  return APP_NAV_ITEMS.filter(
    (item: NavItem) => !item.roles || item.roles.includes(role),
  )
}

/** Atalho do cabeçalho para a área do papel (só os itens com `roleArea`). */
export function roleAreaItemsFor(role: NavRole): readonly NavItem[] {
  return navItemsFor(role).filter((item) => item.roleArea)
}
