import type { ReactNode } from 'react'

/** Área aberta a todos: nunca lê sessão nem redireciona. */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      {children}
    </main>
  )
}
