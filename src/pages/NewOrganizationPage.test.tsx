import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setToken } from '../auth/tokenStorage'
import { installFakeApi, organization } from '../test/fakeApi'
import { apiRoutes, heading, renderApp } from '../test/renderApp'

const personal = organization({ id: 1, name: "Ana's space", myRole: 'Owner' })
const created = organization({ id: 4, name: 'Night Owls Studio', myRole: 'Owner', memberCount: 1 })

const label = 'Organization name'

function signedIn(extra: Parameters<typeof installFakeApi>[0] = {}) {
  let organizations = [personal]
  setToken('token-for-ana')
  return installFakeApi({
    ...apiRoutes,
    'GET /api/organizations': () => ({ status: 200, body: organizations }),
    'GET /api/organizations/1/projects': { status: 200, body: [] },
    'POST /api/organizations': () => {
      organizations = [...organizations, created]
      return { status: 201, body: created }
    },
    'GET /api/organizations/4/projects': { status: 200, body: [] },
    ...extra,
  })
}

function typeName(value: string) {
  fireEvent.input(screen.getByLabelText(label), { target: { value } })
}

describe('creating an organization', () => {
  describe('getting to the page', () => {
    it('from the organization switcher in the sidebar', async () => {
      signedIn()
      renderApp('/organizations/1')
      await heading('Press start')

      fireEvent.click(await screen.findByRole('link', { name: /New organization/ }))

      await heading('New organization')
    })

    it('from the empty state, when the person belongs to none', async () => {
      setToken('token-for-ana')
      installFakeApi({ ...apiRoutes, 'GET /api/organizations': { status: 200, body: [] } })
      renderApp('/')
      await heading('No organization yet')

      // (the switcher's menu has one too: this is the button on the page itself)
      fireEvent.click(within(screen.getByRole('main')).getByRole('link', { name: /New organization/ }))

      await heading('New organization')
    })

    it('by its address, which is not mistaken for the id of an organization', async () => {
      const api = signedIn()

      renderApp('/organizations/new')

      await heading('New organization')
      // "new" is not a number: nothing is asked of the API as if it were organization "NaN"
      expect(api.requests.some((request) => request.path.includes('NaN'))).toBe(false)
    })

    it('and the breadcrumb calls it "new organization"', async () => {
      signedIn()

      renderApp('/organizations/new')
      await heading('New organization')

      const breadcrumb = screen.getByRole('navigation', { name: 'Location' })
      expect(within(breadcrumb).getByText('new organization')).toBeTruthy()
    })
  })

  describe('creating it', () => {
    it('sends the name, and opens the new organization', async () => {
      const api = signedIn()
      renderApp('/organizations/new')
      await heading('New organization')

      typeName('Night Owls Studio')
      fireEvent.click(screen.getByRole('button', { name: 'Create organization' }))

      // The new organization has no projects yet: "Press start", inside it
      await heading('Press start')
      expect(api.requests.find((request) => request.method === 'POST')?.body).toEqual({
        name: 'Night Owls Studio',
      })
      expect(api.count('GET /api/organizations/4/projects')).toBeGreaterThan(0)
    })

    it('cuts the spaces around the name before sending it', async () => {
      const api = signedIn()
      renderApp('/organizations/new')
      await heading('New organization')

      typeName('   Night Owls Studio   ')
      fireEvent.click(screen.getByRole('button', { name: 'Create organization' }))
      await heading('Press start')

      expect(api.requests.find((request) => request.method === 'POST')?.body).toEqual({
        name: 'Night Owls Studio',
      })
    })

    it('rejects a name that is only spaces, like an empty one', async () => {
      const api = signedIn()
      renderApp('/organizations/new')
      await heading('New organization')

      typeName('      ')
      fireEvent.click(screen.getByRole('button', { name: 'Create organization' }))

      expect(screen.getByText('This field is required.')).toBeTruthy()
      expect(api.count('POST /api/organizations')).toBe(0)
    })

    it('shows it in the switcher right away, as the one the person is in', async () => {
      signedIn()
      renderApp('/organizations/new')
      await heading('New organization')

      typeName('Night Owls Studio')
      fireEvent.click(screen.getByRole('button', { name: 'Create organization' }))
      await heading('Press start')

      const box = screen.getByTitle('Switch organization')
      expect(await within(box).findByText('Night Owls Studio')).toBeTruthy()
      expect(within(box).getByText(/owner/)).toBeTruthy()
    })
  })

  describe('when it cannot be created', () => {
    it('asks for a name when it is empty, and asks the API nothing', async () => {
      const api = signedIn()
      renderApp('/organizations/new')
      await heading('New organization')

      fireEvent.click(screen.getByRole('button', { name: 'Create organization' }))

      expect(screen.getByText('This field is required.')).toBeTruthy()
      expect(api.count('POST /api/organizations')).toBe(0)
    })

    it('says how long the name has to be when it is too short', async () => {
      const api = signedIn()
      renderApp('/organizations/new')
      await heading('New organization')

      typeName('A')
      fireEvent.click(screen.getByRole('button', { name: 'Create organization' }))

      expect(screen.getByText('Use at least 2 characters.')).toBeTruthy()
      expect(api.count('POST /api/organizations')).toBe(0)
    })

    it('shows what the API says about the name, under the field', async () => {
      signedIn({
        'POST /api/organizations': {
          status: 400,
          body: { title: 'Validation', errors: { Name: ['The name is not allowed.'] } },
        },
      })
      renderApp('/organizations/new')
      await heading('New organization')

      typeName('Some name')
      fireEvent.click(screen.getByRole('button', { name: 'Create organization' }))

      expect(await screen.findByText('The name is not allowed.')).toBeTruthy()
      expect(screen.getByLabelText(label).getAttribute('aria-invalid')).toBe('true')
    })

    it('shows an error that is not about the name in a box, and keeps what was typed', async () => {
      signedIn({ 'POST /api/organizations': { status: 500, body: { title: 'Something broke' } } })
      renderApp('/organizations/new')
      await heading('New organization')

      typeName('Night Owls Studio')
      fireEvent.click(screen.getByRole('button', { name: 'Create organization' }))

      expect(await screen.findByText('Something broke')).toBeTruthy()
      expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe('Night Owls Studio')
    })
  })
})
