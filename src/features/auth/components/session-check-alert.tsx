import { TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getLoadErrorMessage } from '@/lib/load-error'

import { useSession } from '../hooks/useSession'

export const SESSION_CHECK_ERROR =
  'Não foi possível confirmar sua sessão. Tente recarregar a página.'

/**
 * Faixa de aviso quando o `GET /auth/me` falha por motivo que não é 401. O app segue
 * como visitante, mas o token salvo fica: ao recarregar, a sessão volta se a API voltar.
 * O 401 continua deslogando em silêncio (o `api-client` apaga o token).
 */
export function SessionCheckAlert() {
  const { error } = useSession()
  if (!error) return null

  return (
    <div className="mx-auto w-full max-w-6xl px-3 pt-4 sm:px-4">
      <Alert variant="destructive" data-testid="session-check-alert">
        <TriangleAlert aria-hidden />
        <AlertTitle>{SESSION_CHECK_ERROR}</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span>{getLoadErrorMessage(error)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Recarregar
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
