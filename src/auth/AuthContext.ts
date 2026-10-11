import { createContext } from 'react'
import type { LoginRequest, RegisterRequest, UserDto } from '../api/types'

// - loading:       there is a saved token and we are asking the API whose it is
// - authenticated: signed in; `user` is who
// - anonymous:     nobody is signed in
// - error:         there is a saved token, but we couldn't check it (API down, server error).
//                  The session is NOT dropped: the token may be perfectly fine.
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error'

// How the last session ended, once it has: the person chose to sign out, or the API stopped
// accepting the token (it expired, or the account is gone). null while there is a session,
// and before there ever was one. After a sign-out the app must not remember which page the
// person was on (the next person to sign in isn't going to want it); after an expiry it should.
export type SessionEnd = 'signed-out' | 'expired' | null

export interface AuthContextValue {
  status: AuthStatus
  user: UserDto | null
  error: unknown // what went wrong, when status is 'error'
  sessionEnd: SessionEnd

  // login and register reject with an ApiError when the API says no (wrong password,
  // email taken…): the form that called them shows it
  login: (request: LoginRequest) => Promise<void>
  register: (request: RegisterRequest) => Promise<void>
  logout: () => void

  // Asks the API again whose the saved token is. For when the status is 'error'
  // (API down): the person presses "Try again" once it is back.
  retry: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
