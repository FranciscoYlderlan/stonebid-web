const TOKEN_KEY = 'stonebid.token'

// localStorage pode falhar (janela privada, dados bloqueados): nunca derruba a tela.
export function getSessionToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setSessionToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Sem armazenamento, a sessão vale só até recarregar.
  }
}

export function clearSessionToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Nada a limpar.
  }
}
