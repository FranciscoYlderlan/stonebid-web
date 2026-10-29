import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

import { ROLE_LABELS, roleSchema } from '../schemas/auth-schemas'
import type { Role } from '../types/auth-types'

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  AUCTIONEER: 'Monta lotes e acompanha os arremates.',
  BIDDER: 'Disputa os lotes com lances ao vivo.',
}

type RoleChoiceProps = {
  value?: Role
  error?: string
  onChange: (role: Role) => void
}

/** Escolha do papel da conta: cada conta tem exatamente um (RF-01). */
export function RoleChoice({ value, error, onChange }: RoleChoiceProps) {
  return (
    <FieldSet data-invalid={error ? true : undefined}>
      <FieldLegend variant="label">Como você vai usar o Stonebid?</FieldLegend>
      <RadioGroup
        value={value ?? ''}
        onValueChange={(next) => onChange(roleSchema.parse(next))}
        className="grid gap-3 sm:grid-cols-2"
        aria-invalid={error ? true : undefined}
      >
        {roleSchema.options.map((role) => (
          <FieldLabel key={role} htmlFor={`role-${role}`}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>{ROLE_LABELS[role]}</FieldTitle>
                <FieldDescription>{ROLE_DESCRIPTIONS[role]}</FieldDescription>
              </FieldContent>
              <RadioGroupItem value={role} id={`role-${role}`} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
      {error ? <FieldError>{error}</FieldError> : null}
    </FieldSet>
  )
}
