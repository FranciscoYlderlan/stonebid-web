import { Link } from '@tanstack/react-router'
import type { FormEvent } from 'react'
import { toast } from 'sonner'

import { TextField } from '@/components/common/text-field'
import { FieldGroup } from '@/components/ui/field'
import { useZodForm } from '@/hooks/useZodForm'

import { useRegister } from '../hooks/useRegister'
import { registerSchema } from '../schemas/auth-schemas'
import type { User } from '../types/auth-types'
import { AuthCard } from './auth-card'
import { RoleChoice } from './role-choice'
import { SubmitButton } from './submit-button'

type RegisterFormProps = {
  redirect?: string
  onSuccess: (user: User) => void
}

export function RegisterForm({ redirect, onSuccess }: RegisterFormProps) {
  const form = useZodForm(registerSchema, {
    name: '',
    email: '',
    password: '',
  })
  const register = useRegister({ onSuccess })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = form.validate()
    if (!data) return
    register.mutate(data, { onError: (error) => toast.error(error.message) })
  }

  return (
    <AuthCard
      title="Criar conta"
      description="Escolha um papel: leiloeiro ou licitante."
      footer={
        <span>
          Já tem conta?{' '}
          <Link
            to="/login"
            search={{ redirect }}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Entrar
          </Link>
        </span>
      }
    >
      <form noValidate onSubmit={handleSubmit}>
        <FieldGroup>
          <TextField
            id="name"
            label="Nome"
            autoComplete="name"
            value={form.values.name}
            error={form.errors.name}
            onChange={(event) => form.setValue('name', event.target.value)}
          />
          <TextField
            id="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={form.values.email}
            error={form.errors.email}
            onChange={(event) => form.setValue('email', event.target.value)}
          />
          <TextField
            id="password"
            label="Senha"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            value={form.values.password}
            error={form.errors.password}
            onChange={(event) => form.setValue('password', event.target.value)}
          />
          <RoleChoice
            value={form.values.role}
            error={form.errors.role}
            onChange={(role) => form.setValue('role', role)}
          />
          <SubmitButton pending={register.isPending}>Criar conta</SubmitButton>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
