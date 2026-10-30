import { Link } from '@tanstack/react-router'
import { LogIn, LogOut, UserRound } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { navItemsFor } from '@/config/navigation'

import { useLogout } from '../hooks/useLogout'
import { useSession } from '../hooks/useSession'
import { ROLE_LABELS } from '../schemas/auth-schemas'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/**
 * Lado direito do cabeçalho: Entrar/Cadastrar para visitante. Para quem entrou,
 * atalho para a área do papel (painel do leiloeiro ou carteira) e o menu do
 * usuário, que repete o atalho ao lado de Minha conta e Sair.
 */
export function SessionActions() {
  const { user, isPending } = useSession()
  const logout = useLogout()

  if (isPending) return <Skeleton className="h-8 w-28" />

  if (!user) {
    return (
      <div className="flex items-center gap-1">
        {/* Abaixo de `sm` o Entrar fica só com o ícone, para caber a 320 px. */}
        <Button variant="ghost" asChild>
          <Link to="/login" aria-label="Entrar">
            <LogIn aria-hidden className="sm:hidden" />
            <span className="hidden sm:inline">Entrar</span>
          </Link>
        </Button>
        <Button asChild>
          <Link to="/register">Cadastrar</Link>
        </Button>
      </div>
    )
  }

  // Itens com `roles` são a área própria do papel; Minha conta vale para todos.
  const roleItems = navItemsFor(user.role).filter((item) => item.roles)

  return (
    <div className="flex min-w-0 items-center gap-1">
      {roleItems.map(({ to, label, icon: Icon }) => (
        <Button key={to} variant="ghost" asChild>
          <Link to={to} aria-label={label} data-testid="header-role-shortcut">
            <Icon aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        </Button>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="min-w-0 gap-2 px-1.5"
            aria-label={`Menu de ${user.name}`}
          >
            <Avatar className="size-6">
              <AvatarFallback className="text-[0.65rem]">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            {/* Abaixo de `sm` só o avatar: o nome não cabe ao lado do atalho a 320 px. */}
            <span className="hidden max-w-40 truncate sm:inline">
              {user.name}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col">
            <span className="truncate">{user.name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {ROLE_LABELS[user.role]}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {roleItems.map(({ to, label, icon: Icon }) => (
            <DropdownMenuItem key={to} asChild>
              <Link to={to}>
                <Icon aria-hidden />
                {label}
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem asChild>
            <Link to="/account">
              <UserRound aria-hidden />
              Minha conta
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void logout()}>
            <LogOut aria-hidden />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
