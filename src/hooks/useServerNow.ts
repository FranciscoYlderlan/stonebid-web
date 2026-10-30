import { useEffect, useState } from 'react'

/**
 * Hora do servidor agora (ms), atualizada a cada segundo.
 * `clockOffsetMs` vem da resposta da API (`serverTime` − relógio local na chegada).
 */
export function useServerNow(clockOffsetMs: number, intervalMs = 1000) {
  const [localNow, setLocalNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setLocalNow(Date.now()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])

  return localNow + clockOffsetMs
}
