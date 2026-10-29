import { createFileRoute, useRouter } from '@tanstack/react-router'

import { authSearchSchema, LoginForm } from '@/features/auth'

export const Route = createFileRoute('/_auth/login')({
  validateSearch: authSearchSchema,
  component: LoginPage,
})

function LoginPage() {
  const { redirect } = Route.useSearch()
  const router = useRouter()
  return (
    <LoginForm
      redirect={redirect}
      onSuccess={() =>
        void router.navigate({ href: redirect ?? '/', replace: true })
      }
    />
  )
}
