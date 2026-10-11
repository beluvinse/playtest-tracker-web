import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getToken, setToken } from '../auth/tokenStorage'
import { installFakeApi } from '../test/fakeApi'
import { apiRoutes, fillSignIn, heading, renderApp } from '../test/renderApp'

describe('the user menu', () => {
  it('says who is signed in', async () => {
    installFakeApi(apiRoutes)
    setToken('token-for-ana')

    renderApp('/')

    await heading('Press start')
    expect(screen.getByText('Account menu for Ana')).toBeTruthy()
    expect(screen.getByText('ana@test.local')).toBeTruthy()
  })

  it('signs out: the token goes and the sign-in page comes', async () => {
    installFakeApi(apiRoutes)
    setToken('token-for-ana')
    renderApp('/')
    await heading('Press start')

    fireEvent.click(screen.getByRole('button', { name: 'Sign out', hidden: true }))

    await heading('Sign in')
    expect(getToken()).toBeNull()
  })

  it('does not hand the page you were on to whoever signs in next', async () => {
    installFakeApi(apiRoutes)
    setToken('token-for-ana')
    renderApp('/projects/new') // a page deep inside the app
    await heading('New project')

    fireEvent.click(screen.getByRole('button', { name: 'Sign out', hidden: true }))
    await heading('Sign in')
    await fillSignIn()

    // The home page, not "New project": that page belonged to the person who signed out
    await heading('Press start')
    expect(screen.queryByRole('heading', { name: 'New project' })).toBeNull()
  })

  it('is not there for someone who is signed out', async () => {
    installFakeApi(apiRoutes)

    renderApp('/login')

    await heading('Sign in')
    expect(screen.queryByText(/Account menu for/)).toBeNull()
  })
})
