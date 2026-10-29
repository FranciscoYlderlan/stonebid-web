import { createFileRoute, useRouter } from '@tanstack/react-router'

import { authSearchSchema, RegisterForm } from '@/features/auth'

export const Route = createFileRoute('/_auth/register')({
  validateSearch: authSearchSchema,
  component: RegisterPage,
})

function RegisterPage() {
  const { redirect } = Route.useSearch()
  const router = useRouter()
  return (
    <RegisterForm
      redirect={redirect}
      onSuccess={() =>
        void router.navigate({ href: redirect ?? '/', replace: true })
      }
    />
  )
}
