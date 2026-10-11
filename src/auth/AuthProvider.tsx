import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authKeys, getCurrentUser, login as loginRequest, register as registerRequest } from '../api/auth'
import { ApiError, setUnauthorizedHandler } from '../api/client'
import type { AuthResponse, LoginRequest, RegisterRequest } from '../api/types'
import { AuthContext } from './AuthContext'
import type { AuthContextValue, AuthStatus } from './AuthContext'
import { clearToken, getToken, setToken, tokenStorageKey } from './tokenStorage'

// Keeps the session for the whole app. The token lives in localStorage (so it survives a reload)
// and is mirrored here in state (so React re-renders when it changes). Who the token belongs to
// is asked to the API ("me") and cached like any other data.
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setTokenState] = useState<string | null>(getToken)

  // Whose token is it? Only asked when there is one. After a login we already know the answer,
  // so it's put in the cache by hand (see saveSession) and this request never happens.
  const me = useQuery({
    queryKey: authKeys.me,
    queryFn: getCurrentUser,
    enabled: token !== null,
    staleTime: Infinity, // a person's identity doesn't change while the session lasts
  })

  // Forgets everything about the person who was signed in: the token and every cached answer
  // (their projects, bugs…), so the next person to sign in on this browser never sees them
  const endSession = useCallback(() => {
    clearToken()
    setTokenState(null)
    queryClient.clear()
  }, [queryClient])

  const saveSession = useCallback(
    (response: AuthResponse) => {
      setToken(response.token)
      queryClient.setQueryData(authKeys.me, response.user)
      setTokenState(response.token)
    },
    [queryClient],
  )

  const login = useCallback(
    async (request: LoginRequest) => saveSession(await loginRequest(request)),
    [saveSession],
  )

  const register = useCallback(
    async (request: RegisterRequest) => saveSession(await registerRequest(request)),
    [saveSession],
  )

  // The API calls this when it rejects our token (expired, or the account is gone)
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setTokenState(null)
      queryClient.clear()
    })
    return () => setUnauthorizedHandler(null)
  }, [queryClient])

  // Two tabs of the app share one localStorage. If you log out (or in) in one tab, the browser
  // tells the other tabs through the "storage" event, so they follow along.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      // key is null when the whole storage was cleared
      if (event.key !== null && event.key !== tokenStorageKey) return

      const current = getToken()
      setTokenState(current)
      if (current === null) queryClient.clear()
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [queryClient])

  const value = useMemo<AuthContextValue>(() => {
    let status: AuthStatus
    if (token === null) {
      status = 'anonymous'
    } else if (me.data) {
      status = 'authenticated'
    } else if (me.isError && !(me.error instanceof ApiError && me.error.status === 401)) {
      // Couldn't check the token for a reason that says nothing about it (API down…):
      // keep the session instead of logging the person out
      status = 'error'
    } else {
      status = 'loading'
    }

    return {
      status,
      user: token !== null ? (me.data ?? null) : null,
      error: status === 'error' ? me.error : null,
      login,
      register,
      logout: endSession,
    }
  }, [token, me.data, me.isError, me.error, login, register, endSession])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
