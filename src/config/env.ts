import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z
    .url()
    .default('http://localhost:3333')
    .transform((url) => url.replace(/\/+$/, '')),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  throw new Error(
    `Variáveis de ambiente inválidas: ${z.prettifyError(parsed.error)}`,
  )
}

export const env = {
  apiUrl: parsed.data.VITE_API_URL,
} as const
