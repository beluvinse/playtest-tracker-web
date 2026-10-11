import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, renderHook, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest } from '../api/client'
import { ana, authResponse, installFakeApi, installUnreachableApi } from '../test/fakeApi'
import { AuthProvider } from './AuthProvider'
import type { AuthContextValue } from './AuthContext'
import { getToken, setToken, tokenStorageKey } from './tokenStorage'
import { useAuth } from './useAuth'

// Shows the session in the page and hands the tests a way to read and drive it.
// The retry is off so a failing request fails at once, instead of waiting for retries.
function renderWithAuth() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const session = { current: null as AuthContextValue | null }

  function Probe() {
    const auth = useAuth()
    // Saved in an effect, not while rendering: React doesn't allow changing outside
    // variables during a render
    useEffect(() => {
      session.current = auth
    })
    return null
  }

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  )

  return { queryClient, auth: () => session.current! }
}

// A fake "me" endpoint that only answers 200 to the right token, like the real one
const meRoute = {
  'GET /api/auth/me': ({ authorization }: { authorization: string | null }) =>
    authorization === 'Bearer token-for-ana'
      ? { status: 200, body: ana }
      : { status: 401 },
}

describe('AuthProvider', () => {
  describe('when the app opens', () => {
    it('is anonymous, and asks nothing, if there is no saved token', async () => {
      const api = installFakeApi(meRoute)

      const { auth } = renderWithAuth()

      expect(auth().status).toBe('anonymous')
      expect(auth().user).toBeNull()
      expect(api.requests).toHaveLength(0)
    })

    it('checks a saved token with the API and ends up authenticated', async () => {
      const api = installFakeApi(meRoute)
      setToken('token-for-ana')

      const { auth } = renderWithAuth()

      expect(auth().status).toBe('loading')
      await waitFor(() => expect(auth().status).toBe('authenticated'))
      expect(auth().user).toEqual(ana)
      expect(api.count('GET /api/auth/me')).toBe(1)
      expect(api.requests[0].authorization).toBe('Bearer token-for-ana')
    })

    it('drops a saved token the API refuses', async () => {
      installFakeApi(meRoute)
      setToken('a-token-that-expired')

      const { auth } = renderWithAuth()

      await waitFor(() => expect(auth().status).toBe('anonymous'))
      expect(getToken()).toBeNull()
    })

    it('keeps the session when the API cannot be reached: the token may be perfectly good', async () => {
      installUnreachableApi()
      setToken('token-for-ana')

      const { auth } = renderWithAuth()

      await waitFor(() => expect(auth().status).toBe('error'))
      expect(getToken()).toBe('token-for-ana')
      expect(auth().error).toBeInstanceOf(TypeError)
    })
  })

  describe('login', () => {
    it('signs in, saves the token and does not need to ask "me": the answer already says who', async () => {
      const api = installFakeApi({ 'POST /api/auth/login': { status: 200, body: authResponse() } })
      const { auth } = renderWithAuth()

      await act(() => auth().login({ email: 'ana@test.local', password: 'Sunflower7' }))

      expect(auth().status).toBe('authenticated')
      expect(auth().user).toEqual(ana)
      expect(getToken()).toBe('token-for-ana')
      expect(api.count('GET /api/auth/me')).toBe(0)
      expect(api.requests[0].body).toEqual({ email: 'ana@test.local', password: 'Sunflower7' })
    })

    it('rejects with the API error on a wrong password, and stays signed out', async () => {
      installFakeApi({
        'POST /api/auth/login': { status: 401, body: { title: 'Invalid email or password' } },
      })
      const { auth } = renderWithAuth()

      const attempt = act(() => auth().login({ email: 'ana@test.local', password: 'wrong' }))

      await expect(attempt).rejects.toMatchObject({
        status: 401,
        message: 'Invalid email or password',
      })
      expect(auth().status).toBe('anonymous')
      expect(getToken()).toBeNull()
    })

    it('hands the form the problems of each field when registering fails', async () => {
      installFakeApi({
        'POST /api/auth/register': {
          status: 409,
          body: { title: 'Email already in use', errors: { Email: ['There is already an account.'] } },
        },
      })
      const { auth } = renderWithAuth()

      const error = await act(() =>
        auth()
          .register({ email: 'ana@test.local', password: 'Sunflower7', displayName: 'Ana' })
          .catch((e: unknown) => e),
      )

      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).fieldErrors).toEqual({ email: ['There is already an account.'] })
      expect(auth().status).toBe('anonymous')
    })
  })

  describe('register', () => {
    it('creates the account and signs in right away', async () => {
      const api = installFakeApi({
        'POST /api/auth/register': { status: 201, body: authResponse() },
      })
      const { auth } = renderWithAuth()

      await act(() =>
        auth().register({ email: 'ana@test.local', password: 'Sunflower7', displayName: 'Ana' }),
      )

      expect(auth().status).toBe('authenticated')
      expect(auth().user?.displayName).toBe('Ana')
      expect(getToken()).toBe('token-for-ana')
      expect(api.requests[0].body).toMatchObject({ displayName: 'Ana' })
    })
  })

  describe('logout', () => {
    it('forgets the token AND everything cached, so the next person never sees it', async () => {
      installFakeApi({ 'POST /api/auth/login': { status: 200, body: authResponse() } })
      const { auth, queryClient } = renderWithAuth()
      await act(() => auth().login({ email: 'ana@test.local', password: 'Sunflower7' }))
      queryClient.setQueryData(['projects'], [{ id: 1, name: "Ana's private project" }])

      act(() => auth().logout())

      expect(auth().status).toBe('anonymous')
      expect(auth().user).toBeNull()
      expect(getToken()).toBeNull()
      expect(queryClient.getQueryData(['projects'])).toBeUndefined()
      // An empty, disabled "me" query may be rebuilt by the provider itself; what must not
      // survive is any query that still holds data
      const stillHoldingData = queryClient
        .getQueryCache()
        .getAll()
        .filter((query) => query.state.data !== undefined)
      expect(stillHoldingData).toHaveLength(0)
    })
  })

  describe('while signed in', () => {
    it('ends the session when the API rejects the token on any request', async () => {
      installFakeApi({
        'POST /api/auth/login': { status: 200, body: authResponse() },
        'GET /api/projects': { status: 401 },
      })
      const { auth } = renderWithAuth()
      await act(() => auth().login({ email: 'ana@test.local', password: 'Sunflower7' }))

      // e.g. the token expired in the middle of using the app
      await act(() => apiRequest('/api/projects').catch(() => undefined))

      expect(auth().status).toBe('anonymous')
      expect(getToken()).toBeNull()
    })
  })

  describe('two tabs of the app', () => {
    // The browser fires a "storage" event in the OTHER tabs when one tab changes localStorage
    function otherTabChangesToken(token: string | null, key: string | null = tokenStorageKey) {
      act(() => {
        if (token === null) localStorage.removeItem(tokenStorageKey)
        else localStorage.setItem(tokenStorageKey, token)
        window.dispatchEvent(new StorageEvent('storage', { key }))
      })
    }

    it('follows a logout done in another tab', async () => {
      installFakeApi(meRoute)
      setToken('token-for-ana')
      const { auth } = renderWithAuth()
      await waitFor(() => expect(auth().status).toBe('authenticated'))

      otherTabChangesToken(null)

      expect(auth().status).toBe('anonymous')
    })

    it('follows a login done in another tab', async () => {
      installFakeApi(meRoute)
      const { auth } = renderWithAuth()
      expect(auth().status).toBe('anonymous')

      otherTabChangesToken('token-for-ana')

      await waitFor(() => expect(auth().status).toBe('authenticated'))
      expect(auth().user).toEqual(ana)
    })

    it('ignores changes to anything that is not the token', async () => {
      installFakeApi(meRoute)
      setToken('token-for-ana')
      const { auth } = renderWithAuth()
      await waitFor(() => expect(auth().status).toBe('authenticated'))

      // The token key itself is untouched: only another key "changed"
      act(() => {
        window.dispatchEvent(new StorageEvent('storage', { key: 'something.else' }))
      })

      expect(auth().status).toBe('authenticated')
    })
  })

  it('useAuth refuses to work outside an <AuthProvider>, with a message that says why', () => {
    // React prints the error it throws; keep the test output clean
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/)
  })
})
