import { TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { EmptyState } from './empty-state'

type ErrorStateProps = {
  title?: string
  error: unknown
  onRetry?: () => void
  className?: string
}

/** Falha ao carregar dados: mensagem da API (em português) e "Tentar de novo". */
export function ErrorState({
  title = 'Não foi possível carregar',
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <EmptyState
      className={className}
      icon={<TriangleAlert />}
      title={title}
      description={
        error instanceof Error && error.message
          ? error.message
          : 'Tente de novo em instantes.'
      }
      action={
        onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Tentar de novo
          </Button>
        ) : null
      }
    />
  )
}
