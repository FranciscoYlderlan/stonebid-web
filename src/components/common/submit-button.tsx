import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

type SubmitButtonProps = ComponentProps<typeof Button> & { pending: boolean }

/** Botão de envio que se desabilita e mostra o spinner enquanto a requisição está no ar. */
export function SubmitButton({
  pending,
  disabled,
  children,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {children}
    </Button>
  )
}
