import { Link } from '@tanstack/react-router'
import { LogOut, UserRound } from 'lucide-react'

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

/** Lado direito do cabeçalho: Entrar/Cadastrar para visitante; nome e Sair para quem entrou. */
export function SessionActions() {
  const { user, isPending } = useSession()
  const logout = useLogout()

  if (isPending) return <Skeleton className="h-8 w-28" />

  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <Button variant="ghost" asChild>
          <Link to="/login">Entrar</Link>
        </Button>
        <Button asChild>
          <Link to="/register">Cadastrar</Link>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-1.5">
          <Avatar className="size-6">
            <AvatarFallback className="text-[0.65rem]">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-40 truncate">{user.name}</span>
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
  )
}
