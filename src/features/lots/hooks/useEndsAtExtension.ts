import { useEffect, useState } from 'react'

/** Quanto tempo o destaque "Prorrogado" fica na tela. */
const HIGHLIGHT_MS = 6_000

/**
 * Prorrogação do anti-sniping (RN-10): quando o `endsAt` do lote aumenta, devolve quanto ele
 * andou (ms) por alguns segundos, para a sala destacar; depois, `null`.
 */
export function useEndsAtExtension(endsAt: string | undefined) {
  const [previous, setPrevious] = useState(endsAt)
  const [extension, setExtension] = useState<{
    ms: number
    endsAt: string
  } | null>(null)

  // Ajuste durante a renderização (padrão do React para estado derivado de uma prop).
  if (endsAt !== previous) {
    setPrevious(endsAt)
    const delta =
      endsAt && previous ? Date.parse(endsAt) - Date.parse(previous) : 0
    if (endsAt && delta > 0) setExtension({ ms: delta, endsAt })
  }

  useEffect(() => {
    if (!extension) return
    const timer = window.setTimeout(() => setExtension(null), HIGHLIGHT_MS)
    return () => window.clearTimeout(timer)
  }, [extension])

  return extension?.ms ?? null
}
