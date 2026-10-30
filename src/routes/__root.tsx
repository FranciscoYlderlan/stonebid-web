import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  Link,
  Outlet,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { FileQuestion, TriangleAlert } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import {
  SessionActions,
  SessionCheckAlert,
  type AuthContext,
  type User,
} from '@/features/auth'
import { getLoadErrorMessage } from '@/lib/load-error'

export type RouterContext = {
  queryClient: QueryClient
  auth: AuthContext
}

export const Route = createRootRouteWithContext<RouterContext>()({
  // Sessão resolvida uma vez por navegação (em cache). 401 = visitante (user null), não erro;
  // outra falha também vira visitante, com o aviso do SessionCheckAlert.
  beforeLoad: async ({ context }): Promise<{ user: User | null }> => ({
    user: await context.auth.getSession(),
  }),
  component: RootLayout,
  notFoundComponent: NotFound,
  errorComponent: RootError,
})

function RootLayout() {
  return (
    <div className="flex min-h-svh flex-col [--header-height:--spacing(14)]">
      <Header actions={<SessionActions />} />
      <SessionCheckAlert />
      <Outlet />
    </div>
  )
}

function NotFound() {
  return (
    <EmptyState
      className="flex-1"
      icon={<FileQuestion />}
      title="Página não encontrada"
      description="O endereço não existe ou foi removido."
      action={
        <Button asChild>
          <Link to="/">Voltar à vitrine</Link>
        </Button>
      }
    />
  )
}

function RootError({ error }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <EmptyState
      className="flex-1"
      icon={<TriangleAlert />}
      title="Algo deu errado"
      description={getLoadErrorMessage(error)}
      action={
        <Button onClick={() => void router.invalidate()}>Tentar de novo</Button>
      }
    />
  )
}
