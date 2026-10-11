import { createContext } from 'react'
import type { LoginRequest, RegisterRequest, UserDto } from '../api/types'

// - loading:       there is a saved token and we are asking the API whose it is
// - authenticated: signed in; `user` is who
// - anonymous:     nobody is signed in
// - error:         there is a saved token, but we couldn't check it (API down, server error).
//                  The session is NOT dropped: the token may be perfectly fine.
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error'

export interface AuthContextValue {
  status: AuthStatus
  user: UserDto | null
  error: unknown // what went wrong, when status is 'error'

  // login and register reject with an ApiError when the API says no (wrong password,
  // email taken…): the form that called them shows it
  login: (request: LoginRequest) => Promise<void>
  register: (request: RegisterRequest) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
