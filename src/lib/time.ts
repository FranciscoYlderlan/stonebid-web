const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

/** Data ISO (UTC) → "29/10/2026, 14:30" no fuso de quem vê. */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso))
}

const pad = (value: number) => String(value).padStart(2, '0')

/** Milissegundos restantes → "2d 03:04:05" ou "03:04:05" (nunca negativo). */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  return days > 0 ? `${days}d ${clock}` : clock
}

/**
 * Deslocamento entre o relógio do servidor e o local, medido quando a resposta chega.
 * Hora do servidor agora = `Date.now() + offset` (o relógio do usuário sozinho nunca vale).
 */
export function clockOffsetFrom(serverTime: string, receivedAt = Date.now()) {
  return Date.parse(serverTime) - receivedAt
}

/** `Date` → valor de `<input type="datetime-local">` no fuso local ("2026-10-29T14:30"). */
export function toDateTimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Hora do servidor agora (ms), dado o deslocamento medido em `clockOffsetFrom`. */
export function serverNowMs(clockOffsetMs: number): number {
  return Date.now() + clockOffsetMs
}
