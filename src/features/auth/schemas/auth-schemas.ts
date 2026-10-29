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

export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
})

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.'),
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres.'),
  role: roleSchema,
})

/** `?redirect` aceita só caminho interno (contra redirecionamento aberto: `//site.com`). */
export const authSearchSchema = z.object({
  redirect: z
    .string()
    .regex(/^\/(?!\/)/)
    .optional()
    .catch(undefined),
})
