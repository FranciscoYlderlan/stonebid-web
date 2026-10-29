import type { z } from 'zod'

import type {
  authResponseSchema,
  authSearchSchema,
  loginSchema,
  registerSchema,
  roleSchema,
  userSchema,
} from '../schemas/auth-schemas'

export type Role = z.infer<typeof roleSchema>
export type User = z.infer<typeof userSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type AuthSearch = z.infer<typeof authSearchSchema>

/** O que o router injeta no contexto para guards e loaders. */
export type AuthContext = {
  /** Usuário da sessão, ou `null` para visitante (401 não é erro). */
  getSession: () => Promise<User | null>
}
