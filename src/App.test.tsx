import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { apiRequest } from './api/client'
import { getToken, setToken } from './auth/tokenStorage'
import { installFakeApi, installUnreachableApi } from './test/fakeApi'
import { apiRoutes, fillSignIn, heading, renderApp } from './test/renderApp'

describe('the door of the app', () => {
  describe('someone who is not signed in', () => {
    it('is sent to the sign-in page, and the app asks for none of its data', async () => {
      const api = installFakeApi(apiRoutes)

      renderApp('/')

      await heading('Sign in')
      expect(api.count('GET /api/projects')).toBe(0)
    })

    it('is sent back to the page they wanted once they sign in', async () => {
      installFakeApi(apiRoutes)
      renderApp('/projects/new') // a page deep inside the app

      await heading('Sign in')
      await fillSignIn()

      await heading('New project')
      expect(getToken()).toBe('token-for-ana')
    })

    it('still gets sent back there if they decide to create an account instead', async () => {
      installFakeApi(apiRoutes)
      renderApp('/projects/new')

      await heading('Sign in')
      fireEvent.click(screen.getByRole('link', { name: 'Create an account' }))
      await heading('New player')
      fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Ana' } })
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@test.local' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Sunflower7' } })
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

      await heading('New project')
    })

    it('goes to the home page after signing in if they had no page in mind', async () => {
      installFakeApi(apiRoutes)
      renderApp('/login')

      await fillSignIn()

      await heading('Press start') // the home page of an account with no projects yet
    })
  })

  describe('someone with a saved token', () => {
    it('sees a waiting screen while the token is checked, and then the app', async () => {
      installFakeApi(apiRoutes)
      setToken('token-for-ana')

      renderApp('/')

      expect(screen.getByRole('status').textContent).toMatch(/checking your session/i)
      await heading('Press start')
    })

    it('does not see the sign-in form flash by while the token is being checked on /login', async () => {
      installFakeApi(apiRoutes)
      setToken('token-for-ana')

      renderApp('/login')

      // Right away, before the API has answered: a waiting screen, not a form for someone who is signed in
      expect(screen.getByRole('status').textContent).toMatch(/checking your session/i)
      expect(screen.queryByLabelText('Password')).toBeNull()
      await heading('Press start')
    })

    it('is sent into the app, not shown the sign-in form, if they open /login', async () => {
      installFakeApi(apiRoutes)
      setToken('token-for-ana')

      renderApp('/login')

      await heading('Press start')
      expect(screen.queryByRole('heading', { name: 'Sign in' })).toBeNull()
    })

    it('is sent to sign in when the API no longer accepts the token', async () => {
      installFakeApi(apiRoutes)
      setToken('a-token-that-expired')

      renderApp('/projects/new')

      await heading('Sign in')
      expect(getToken()).toBeNull()
    })

    it('is told the API cannot be reached, keeps the session, and can try again', async () => {
      installUnreachableApi()
      setToken('token-for-ana')
      renderApp('/')

      await heading("Can't connect")
      expect(getToken()).toBe('token-for-ana') // not signed out just because the API is down

      installFakeApi(apiRoutes) // the API is back
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

      await heading('Press start')
    })

    it('can give up on a session that cannot be checked, by signing out', async () => {
      installUnreachableApi()
      setToken('token-for-ana')
      renderApp('/')

      await heading("Can't connect")
      fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

      await heading('Sign in')
      expect(getToken()).toBeNull()
    })
  })

  it('sends someone whose session ends while they work to sign in, and back again afterwards', async () => {
    installFakeApi({
      ...apiRoutes,
      'GET /api/bugs/1': { status: 401 }, // e.g. the token expired while they were working
    })
    setToken('token-for-ana')
    renderApp('/projects/new')
    await heading('New project')

    await act(() => apiRequest('/api/bugs/1').catch(() => undefined))

    await heading('Sign in')
    await fillSignIn()
    await waitFor(() => expect(screen.getByRole('heading', { name: 'New project' })).toBeTruthy())
  })
})
