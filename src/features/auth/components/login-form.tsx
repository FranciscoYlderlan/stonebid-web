import { Link } from '@tanstack/react-router'
import type { FormEvent } from 'react'
import { toast } from 'sonner'

import { SubmitButton } from '@/components/common/submit-button'
import { TextField } from '@/components/common/text-field'
import { FieldGroup } from '@/components/ui/field'
import { useZodForm } from '@/hooks/useZodForm'

import { useLogin } from '../hooks/useLogin'
import { loginSchema } from '../schemas/auth-schemas'
import type { User } from '../types/auth-types'
import { AuthCard } from './auth-card'

type LoginFormProps = {
  redirect?: string
  onSuccess: (user: User) => void
}

export function LoginForm({ redirect, onSuccess }: LoginFormProps) {
  const form = useZodForm(loginSchema, { email: '', password: '' })
  const login = useLogin({ onSuccess })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = form.validate()
    if (!data) return
    login.mutate(data, { onError: (error) => toast.error(error.message) })
  }

  return (
    <AuthCard
      title="Entrar"
      description="Acesse sua conta para dar lances ou gerenciar seus lotes."
      footer={
        <span>
          Ainda não tem conta?{' '}
          <Link
            to="/register"
            search={{ redirect }}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Cadastre-se
          </Link>
        </span>
      }
    >
      <form noValidate onSubmit={handleSubmit}>
        <FieldGroup>
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
            autoComplete="current-password"
            value={form.values.password}
            error={form.errors.password}
            onChange={(event) => form.setValue('password', event.target.value)}
          />
          <SubmitButton pending={login.isPending} size="lg" className="w-full">
            Entrar
          </SubmitButton>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
