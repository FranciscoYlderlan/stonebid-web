// API pública da feature auth: nada de fora importa arquivos internos.
export {
  authKeys,
  createAuthContext,
  endSession,
  sessionQueryOptions,
} from './api/auth-api'
export { AccountSummary } from './components/account-summary'
export { LoginForm } from './components/login-form'
export { RegisterForm } from './components/register-form'
export { SessionActions } from './components/session-actions'
export { useLogin } from './hooks/useLogin'
export { useLogout } from './hooks/useLogout'
export { useRegister } from './hooks/useRegister'
export { useSession } from './hooks/useSession'
export { authSearchSchema, ROLE_LABELS } from './schemas/auth-schemas'
export type { AuthContext, AuthSearch, Role, User } from './types/auth-types'
