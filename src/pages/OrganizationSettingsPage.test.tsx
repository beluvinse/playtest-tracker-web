import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setToken } from '../auth/tokenStorage'
import { installFakeApi, organization } from '../test/fakeApi'
import { apiRoutes, heading, renderApp } from '../test/renderApp'

const label = 'Organization name'

// Ana owns her own organization (1) and a studio (4); she is only a Member of another (2);
// and the demo (3) is there too
const personal = organization({ id: 1, name: "Ana's space", myRole: 'Owner' })
const studio = organization({ id: 2, name: 'Night Owls', myRole: 'Member' })
const demo = organization({ id: 3, name: 'Demo Studio', myRole: 'Owner', isDemo: true })

function signedIn(extra: Parameters<typeof installFakeApi>[0] = {}) {
  let organizations = [personal, studio, demo]
  setToken('token-for-ana')
  return installFakeApi({
    ...apiRoutes,
    'GET /api/organizations': () => ({ status: 200, body: organizations }),
    'GET /api/organizations/1/projects': { status: 200, body: [] },
    'PUT /api/organizations/1': ({ body }) => {
      const renamed = { ...personal, name: (body as { name: string }).name }
      organizations = [renamed, studio, demo]
      return { status: 200, body: renamed }
    },
    'GET /api/organizations/2/projects': { status: 200, body: [] },
    'GET /api/organizations/3/projects': { status: 200, body: [] },
    ...extra,
  })
}

function typeName(value: string) {
  fireEvent.input(screen.getByLabelText(label), { target: { value } })
}

describe('the settings of an organization', () => {
  describe('who can change them', () => {
    it('the Owner gets the rename form, with the current name', async () => {
      signedIn()

      renderApp('/organizations/1/settings')
      await heading('Settings')

      const field = await screen.findByLabelText(label)
      expect((field as HTMLInputElement).value).toBe("Ana's space")
      expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy()
    })

    it('a Member does not: the page says only the owner can', async () => {
      signedIn()

      renderApp('/organizations/2/settings')
      await heading('Settings')

      expect(await screen.findByText(/Only the owner can change the settings/)).toBeTruthy()
      expect(screen.queryByLabelText(label)).toBeNull()
    })

    it('nobody on the example organization, not even its Owner', async () => {
      signedIn()

      renderApp('/organizations/3/settings')
      await heading('Settings')

      expect(await screen.findByText(/example organization: it can't be renamed or deleted/)).toBeTruthy()
      expect(screen.queryByLabelText(label)).toBeNull()
    })
  })

  describe('renaming', () => {
    it('sends the new name (without the spaces around it), and says it was saved', async () => {
      const api = signedIn()
      renderApp('/organizations/1/settings')
      await heading('Settings')
      await screen.findByLabelText(label)

      typeName('  Ana Games  ')
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect((await screen.findByRole('status')).textContent).toBe('Saved.')
      expect(api.requests.find((request) => request.method === 'PUT')?.body).toEqual({
        name: 'Ana Games',
      })
    })

    it('shows the new name everywhere: the switcher and the page', async () => {
      signedIn()
      renderApp('/organizations/1/settings')
      await heading('Settings')
      await screen.findByLabelText(label)

      typeName('Ana Games')
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
      await screen.findByRole('status')

      const box = screen.getByTitle('Switch organization')
      expect(await within(box).findByText('Ana Games')).toBeTruthy()
      expect(await screen.findByText('Ana Games · settings')).toBeTruthy()
    })

    it('sends nothing when the name did not change', async () => {
      const api = signedIn()
      renderApp('/organizations/1/settings')
      await heading('Settings')
      await screen.findByLabelText(label)

      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
      // A request leaves a moment after the click, so "nothing was sent" has to wait for that moment
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(api.count('PUT /api/organizations/1')).toBe(0)
      expect(screen.queryByRole('status')).toBeNull()
    })

    it('renames the organization of the page, not another one the person also owns', async () => {
      const second = organization({ id: 4, name: 'Night Owls Games', myRole: 'Owner' })
      const api = signedIn({
        'GET /api/organizations': { status: 200, body: [personal, second] },
        'GET /api/organizations/4/projects': { status: 200, body: [] },
        'PUT /api/organizations/4': { status: 200, body: { ...second, name: 'Night Owls Studio' } },
      })
      renderApp('/organizations/4/settings')
      await heading('Settings')
      await screen.findByLabelText(label)

      typeName('Night Owls Studio')
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      await screen.findByRole('status')
      expect(api.count('PUT /api/organizations/4')).toBe(1)
      expect(api.count('PUT /api/organizations/1')).toBe(0)
    })

    it('asks for a name when it is empty, and asks the API nothing', async () => {
      const api = signedIn()
      renderApp('/organizations/1/settings')
      await heading('Settings')
      await screen.findByLabelText(label)

      typeName('')
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(screen.getByText('This field is required.')).toBeTruthy()
      expect(api.count('PUT /api/organizations/1')).toBe(0)
    })

    it('says how long the name has to be when it is too short', async () => {
      const api = signedIn()
      renderApp('/organizations/1/settings')
      await heading('Settings')
      await screen.findByLabelText(label)

      typeName('A')
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(screen.getByText('Use at least 2 characters.')).toBeTruthy()
      expect(api.count('PUT /api/organizations/1')).toBe(0)
    })

    it('shows what the API says about the name, under the field, until the name changes', async () => {
      signedIn({
        'PUT /api/organizations/1': {
          status: 400,
          body: { title: 'Validation', errors: { Name: ['The name is not allowed.'] } },
        },
      })
      renderApp('/organizations/1/settings')
      await heading('Settings')
      await screen.findByLabelText(label)
      typeName('Some name')
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
      expect(await screen.findByText('The name is not allowed.')).toBeTruthy()

      typeName('Another name')

      expect(screen.queryByText('The name is not allowed.')).toBeNull()
    })

    it('shows an error that is not about the name in a box, and keeps what was typed', async () => {
      signedIn({ 'PUT /api/organizations/1': { status: 500, body: { title: 'Something broke' } } })
      renderApp('/organizations/1/settings')
      await heading('Settings')
      await screen.findByLabelText(label)

      typeName('Ana Games')
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(await screen.findByText('Something broke')).toBeTruthy()
      expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe('Ana Games')
    })
  })

  describe('the sidebar', () => {
    it('has a "Settings" link for the Owner of an organization of their own', async () => {
      signedIn()

      renderApp('/organizations/1')
      await heading('Press start')

      const link = await screen.findByRole('link', { name: /Settings/ })
      expect(link.getAttribute('href')).toBe('/organizations/1/settings')
    })

    it('does not for a Member', async () => {
      signedIn()

      renderApp('/organizations/2')
      await heading('Press start')
      await within(screen.getByTitle('Switch organization')).findByText('Night Owls')

      expect(screen.queryByRole('link', { name: /Settings/ })).toBeNull()
    })

    it('does not for the example organization, even for its Owner', async () => {
      signedIn()

      renderApp('/organizations/3')
      await heading('Press start')
      await within(screen.getByTitle('Switch organization')).findByText('Demo Studio')

      expect(screen.queryByRole('link', { name: /Settings/ })).toBeNull()
    })

    it('calls the page "settings" in the breadcrumb', async () => {
      signedIn()

      renderApp('/organizations/1/settings')
      await heading('Settings')

      const breadcrumb = screen.getByRole('navigation', { name: 'Location' })
      expect(within(breadcrumb).getByText('settings')).toBeTruthy()
    })
  })

  describe('when it cannot be shown', () => {
    it.each(['/organizations/99/settings', '/organizations/abc/settings'])(
      'says "not found" for %s, which is not an organization of hers',
      async (address) => {
        const api = signedIn()

        renderApp(address)

        await heading('Organization not found')
        expect(api.requests.some((request) => request.path.includes('NaN'))).toBe(false)
      },
    )
  })
})
