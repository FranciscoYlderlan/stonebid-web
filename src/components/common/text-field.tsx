import type { ComponentProps } from 'react'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type TextFieldProps = Omit<ComponentProps<typeof Input>, 'id'> & {
  id: string
  label: string
  error?: string
}

/** Rótulo + campo + mensagem de erro, no padrão Field do shadcn. */
export function TextField({ id, label, error, ...inputProps }: TextFieldProps) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} aria-invalid={error ? true : undefined} {...inputProps} />
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}
