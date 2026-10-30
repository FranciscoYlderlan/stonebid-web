import { z } from 'zod'

export const roleSchema = z.enum(['AUCTIONEER', 'BIDDER'])

export const ROLE_LABELS: Record<z.infer<typeof roleSchema>, string> = {
  AUCTIONEER: 'Leiloeiro',
  BIDDER: 'Licitante',
}

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: roleSchema,
})

export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string().min(1),
})

export const meResponseSchema = z.object({ user: userSchema })

/** Mesmos limites do `registerBodySchema` da API (`stonebid-api`). */
export const NAME_MAX = 120
export const EMAIL_MAX = 254
export const PASSWORD_MAX = 128

export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z
    .string()
    .min(1, 'Informe a senha.')
    .max(
      PASSWORD_MAX,
      `A senha pode ter no máximo ${PASSWORD_MAX} caracteres.`,
    ),
})

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe seu nome.')
    .max(NAME_MAX, `O nome pode ter no máximo ${NAME_MAX} caracteres.`),
  email: z
    .email('Informe um e-mail válido.')
    .max(EMAIL_MAX, `O e-mail pode ter no máximo ${EMAIL_MAX} caracteres.`),
  password: z
    .string()
    .min(8, 'A senha precisa de pelo menos 8 caracteres.')
    .max(
      PASSWORD_MAX,
      `A senha pode ter no máximo ${PASSWORD_MAX} caracteres.`,
    ),
  role: z.enum(roleSchema.options, {
    error: 'Escolha se você vai ser leiloeiro ou licitante.',
  }),
})

/** `?redirect` aceita só caminho interno (contra redirecionamento aberto: `//site.com`). */
export const authSearchSchema = z.object({
  redirect: z
    .string()
    .regex(/^\/(?!\/)/)
    .optional()
    .catch(undefined),
})
