import { apiRequest } from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, UserDto } from './types'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

// Creates the account and signs in: the answer already has the token.
// Fails with 409 (email taken, under errors.email) or 400 (password rules, under errors.password).
export function register(request: RegisterRequest) {
  return apiRequest<AuthResponse>('/api/auth/register', { method: 'POST', body: request })
}

// Fails with 401 (wrong email or password, the same message for both) or 423 (too many attempts)
export function login(request: LoginRequest) {
  return apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: request })
}

// "Who am I?" with the saved token: tells if it still works, and whose it is
export function getCurrentUser() {
  return apiRequest<UserDto>('/api/auth/me')
}
