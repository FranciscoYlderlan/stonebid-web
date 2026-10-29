import { loginRequest } from '../api/auth-api'
import { useAuthMutation, type AuthMutationOptions } from './useAuthMutation'

export function useLogin(options?: AuthMutationOptions) {
  return useAuthMutation(loginRequest, options)
}
