import { registerRequest } from '../api/auth-api'
import { useAuthMutation, type AuthMutationOptions } from './useAuthMutation'

export function useRegister(options?: AuthMutationOptions) {
  return useAuthMutation(registerRequest, options)
}
