import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { useLogout } from '../hooks/useLogout'
import { useSession } from '../hooks/useSession'
import { ROLE_LABELS } from '../schemas/auth-schemas'

/** Dados da conta logada: nome, e-mail, papel e Sair. */
export function AccountSummary() {
  const { user } = useSession()
  const logout = useLogout()

  if (!user) return null

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="font-heading text-xl" data-testid="account-name">
          {user.name}
        </CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Papel</dt>
          <dd className="font-medium" data-testid="account-role">
            {ROLE_LABELS[user.role]}
          </dd>
        </dl>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={() => void logout()}>
          <LogOut data-icon="inline-start" aria-hidden />
          Sair
        </Button>
      </CardFooter>
    </Card>
  )
}
