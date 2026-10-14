import { screen, within, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getToken } from '../auth/tokenStorage'
import { getLastOrganizationId } from '../organizations/lastOrganization'
import { afterAWhile, authResponse, demoInfo, installFakeApi, organization, project } from '../test/fakeApi'
import { apiRoutes, heading, renderApp } from '../test/renderApp'

function withDemo(extra: Parameters<typeof installFakeApi>[0] = {}) {
  return installFakeApi({
    ...apiRoutes,
    'GET /api/demo': { status: 200, body: demoInfo() },
    ...extra,
  })
}

// A demo account has its own organization (1, empty) and the example one (3, with two projects).
// The API lists the personal one first, like the real one does.
const personal = organization({ id: 1, name: "Luna Park's space", myRole: 'Owner', projectCount: 0 })
const exampleOrganization = organization({
  id: 3,
  name: 'Pink in the Night Studio',
  isDemo: true,
  myRole: 'Member',
  projectCount: 2,
})
const exampleProjects = [
  project({ id: 1, organizationId: 3, name: 'Pink in the Night', code: 'PIN' }),
  project({ id: 2, organizationId: 3, name: 'Neon Drifters', code: 'NEO' }),
]
const bugCount = { status: 200, body: { items: [], page: 1, pageSize: 1, totalCount: 0 } }

function withDemoAccounts() {
  return withDemo({
    'GET /api/organizations': { status: 200, body: [personal, exampleOrganization] },
    'GET /api/organizations/1/projects': { status: 200, body: [] },
    'GET /api/organizations/3/projects': { status: 200, body: exampleProjects },
    'GET /api/projects/1/bugs': bugCount,
    'GET /api/projects/2/bugs': bugCount,
  })
}

describe('the demo on the sign-in page', () => {
  describe('the panel', () => {
    it('offers the people of the example organization, the Owner first, each with their role', async () => {
      withDemo()

      renderApp('/login')
      await heading('Sign in')

      const panel = await screen.findByRole('region', { name: 'Just looking around?' })
      const rows = within(panel).getAllByRole('listitem')
      expect(rows).toHaveLength(3)
      expect(within(rows[0]).getByText('Luna Park')).toBeTruthy()
      expect(within(rows[0]).getByText('luna@demo.test')).toBeTruthy()
      expect(within(rows[0]).getByText('Owner')).toBeTruthy()
      expect(within(rows[1]).getByText('Member')).toBeTruthy()
    })

    it('names the example organization', async () => {
      withDemo()

      renderApp('/login')

      const panel = await screen.findByRole('region', { name: 'Just looking around?' })
      expect(within(panel).getByText('Pink in the Night Studio')).toBeTruthy()
    })

    it('is not there when the API has no demo', async () => {
      installFakeApi({ ...apiRoutes, 'GET /api/demo': { status: 404 } })

      renderApp('/login')
      await heading('Sign in')
      await waitFor(() => expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy())

      expect(screen.queryByRole('region', { name: 'Just looking around?' })).toBeNull()
    })

    it('is not there when the demo cannot be asked for, and the form still works', async () => {
      installFakeApi({ ...apiRoutes, 'GET /api/demo': { status: 500, body: { title: 'Something broke' } } })

      renderApp('/login')
      await heading('Sign in')

      expect(screen.queryByRole('region', { name: 'Just looking around?' })).toBeNull()
      expect(screen.getByLabelText('Email')).toBeTruthy()
    })

    it('is not asked for with a token, because it is for people who have not signed in', async () => {
      const api = withDemo()

      renderApp('/login')
      await screen.findByRole('region', { name: 'Just looking around?' })

      expect(api.requests.find((request) => request.path === '/api/demo')?.authorization).toBeNull()
    })
  })

  describe('entering with one click', () => {
    it('signs in as that account, with the password the API publishes, and opens the app', async () => {
      const api = withDemo()
      renderApp('/login')
      await heading('Sign in')

      fireEvent.click(await screen.findByRole('button', { name: 'Enter as Luna Park' }))

      await heading('Press start') // inside the app (her organization has no projects in this test)
      expect(api.requests.find((request) => request.path === '/api/auth/login')?.body).toEqual({
        email: 'luna@demo.test',
        password: 'Playtest-demo-1',
      })
      expect(getToken()).toBe('token-for-ana')
    })

    it('signs in as the one that was chosen, not always the first', async () => {
      const api = withDemo()
      renderApp('/login')
      await heading('Sign in')

      fireEvent.click(await screen.findByRole('button', { name: 'Enter as Iris Okoye' }))

      await heading('Press start')
      const login = api.requests.find((request) => request.path === '/api/auth/login')
      expect(login?.body).toEqual({ email: 'iris@demo.test', password: 'Playtest-demo-1' })
    })

    it('goes where the person was heading when they were sent to sign in', async () => {
      withDemo()
      renderApp('/organizations/1/projects/new') // a page deep inside the app, asked for while signed out
      await heading('Sign in')

      fireEvent.click(await screen.findByRole('button', { name: 'Enter as Theo Vance' }))

      await heading('New project')
    })

    it('shows why when the API refuses, and stays on the sign-in page', async () => {
      withDemo({
        'POST /api/auth/login': { status: 401, body: { title: 'Invalid email or password' } },
      })
      renderApp('/login')
      await heading('Sign in')

      fireEvent.click(await screen.findByRole('button', { name: 'Enter as Luna Park' }))

      expect(await screen.findByText('Invalid email or password')).toBeTruthy()
      expect(getToken()).toBeNull()
      expect(screen.getByRole('heading', { name: 'Sign in' })).toBeTruthy()
    })

    it('does not let a second click start another sign-in while the first is under way', async () => {
      const api = withDemo({
        'POST /api/auth/login': () => afterAWhile({ status: 200, body: authResponse() }),
      })
      renderApp('/login')
      await heading('Sign in')
      const luna = await screen.findByRole('button', { name: 'Enter as Luna Park' })

      fireEvent.click(luna)

      // Right away, before the API has answered: every Enter button waits, and so does the form's
      await waitFor(() =>
        expect((screen.getByRole('button', { name: 'Enter as Theo Vance' }) as HTMLButtonElement).disabled).toBe(true),
      )
      expect((luna as HTMLButtonElement).disabled).toBe(true)
      fireEvent.click(screen.getByRole('button', { name: 'Enter as Theo Vance' }))
      await heading('Press start')
      expect(api.count('POST /api/auth/login')).toBe(1)
    })

    it('lands in the example organization, with its projects, not in the account\'s own empty one', async () => {
      const api = withDemoAccounts()
      renderApp('/login')
      await heading('Sign in')

      fireEvent.click(await screen.findByRole('button', { name: 'Enter as Theo Vance' }))

      // The example organization has two projects: its overview. Her own has none ("Press start").
      await heading(/2 games in development/)
      expect(api.count('GET /api/organizations/3/projects')).toBeGreaterThan(0)
      expect(api.count('GET /api/organizations/1/projects')).toBe(0)
      const box = screen.getByTitle('Switch organization')
      expect(within(box).getByText('Pink in the Night Studio')).toBeTruthy()
    })

    it('marks the example organization as the last one used, before signing in', async () => {
      withDemoAccounts()
      renderApp('/login')
      await heading('Sign in')

      fireEvent.click(await screen.findByRole('button', { name: 'Enter as Luna Park' }))
      // (synchronously: it can't wait for the sign-in, which starts moving the app as soon as it works)
      expect(getLastOrganizationId()).toBe(3)
      await heading(/2 games in development/)
    })

    it('does not change where the form takes someone: their own organization, as always', async () => {
      withDemoAccounts()
      renderApp('/login')
      await heading('Sign in')
      await screen.findByRole('region', { name: 'Just looking around?' })

      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'luna@demo.test' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Playtest-demo-1' } })
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

      await heading('Press start') // the personal organization, empty
      expect(getLastOrganizationId()).not.toBe(3)
    })

    it('is not mistaken for the form: the form still needs its own email and password', async () => {
      const api = withDemo({ 'POST /api/auth/login': { status: 200, body: authResponse() } })
      renderApp('/login')
      await heading('Sign in')
      await screen.findByRole('region', { name: 'Just looking around?' })

      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

      expect(screen.getAllByText('This field is required.')).toHaveLength(2)
      expect(api.count('POST /api/auth/login')).toBe(0)
    })
  })
})
