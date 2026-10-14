import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { OrganizationDto } from '../api/types'
import { setToken } from '../auth/tokenStorage'
import { afterAWhile, installFakeApi, organization } from '../test/fakeApi'
import { apiRoutes, heading, renderApp } from '../test/renderApp'

// Ana owns her own organization (1) and a studio (4); she is only a Member of another (2)
// and the demo (3) is there too
const personal = organization({ id: 1, name: "Ana's space", myRole: 'Owner', memberCount: 1, projectCount: 0 })
const studio = organization({ id: 4, name: 'Night Owls Games', myRole: 'Owner', memberCount: 3, projectCount: 0 })
const joined = organization({ id: 2, name: 'Night Owls', myRole: 'Member' })
const demo = organization({ id: 3, name: 'Demo Studio', myRole: 'Owner', isDemo: true })

// The list of organizations answers with whatever is still there, like the real API
function signedIn(
  start: OrganizationDto[] = [personal, studio, joined, demo],
  extra: Parameters<typeof installFakeApi>[0] = {},
) {
  let organizations = start
  const remove = (id: number) => () => {
    organizations = organizations.filter((candidate) => candidate.id !== id)
    return { status: 204 }
  }
  setToken('token-for-ana')
  return installFakeApi({
    ...apiRoutes,
    'GET /api/organizations': () => ({ status: 200, body: organizations }),
    'GET /api/organizations/1/projects': { status: 200, body: [] },
    'DELETE /api/organizations/1': remove(1),
    'GET /api/organizations/2/projects': { status: 200, body: [] },
    'GET /api/organizations/3/projects': { status: 200, body: [] },
    'GET /api/organizations/4/projects': { status: 200, body: [] },
    'DELETE /api/organizations/4': remove(4),
    ...extra,
  })
}

const openDialog = () => fireEvent.click(screen.getByRole('button', { name: 'Delete organization' }))
const confirm = () =>
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes, delete' }))

describe('deleting an organization', () => {
  describe('the button', () => {
    it('is there for the Owner, ready to use, when the organization has no projects', async () => {
      signedIn()
      renderApp('/organizations/1/settings')
      await heading('Settings')

      const button = await screen.findByRole('button', { name: 'Delete organization' })
      expect((button as HTMLButtonElement).disabled).toBe(false)
    })

    it('waits while it has projects, and says why', async () => {
      signedIn([{ ...personal, projectCount: 2 }, joined])
      renderApp('/organizations/1/settings')
      await heading('Settings')

      const button = await screen.findByRole('button', { name: 'Delete organization' })
      expect((button as HTMLButtonElement).disabled).toBe(true)
      expect(screen.getByText('It still has 2 projects. Delete them first.')).toBeTruthy()
    })

    it('says it right for a single project', async () => {
      signedIn([{ ...personal, projectCount: 1 }, joined])
      renderApp('/organizations/1/settings')
      await heading('Settings')

      expect(await screen.findByText('It still has 1 project. Delete it first.')).toBeTruthy()
    })

    it('is not offered to a Member, nor on the example organization', async () => {
      signedIn()
      renderApp('/organizations/2/settings')
      await heading('Settings')
      await screen.findByText(/Only the owner can change the settings/)
      expect(screen.queryByRole('button', { name: 'Delete organization' })).toBeNull()
    })

    it('is not offered on the example organization, not even to its Owner', async () => {
      signedIn()
      renderApp('/organizations/3/settings')
      await heading('Settings')
      await screen.findByText(/example organization/)
      expect(screen.queryByRole('button', { name: 'Delete organization' })).toBeNull()
    })
  })

  describe('the question', () => {
    it('asks first, and says what happens to the people', async () => {
      signedIn()
      renderApp('/organizations/4/settings')
      await heading('Settings')
      await screen.findByRole('button', { name: 'Delete organization' })

      openDialog()

      const dialog = screen.getByRole('dialog', { name: 'Delete Night Owls Games?' })
      expect(within(dialog).getByText(/This can't be undone. Its members will lose access/)).toBeTruthy()
    })

    it('warns when it is the only organization the person has', async () => {
      signedIn([personal])
      renderApp('/organizations/1/settings')
      await heading('Settings')
      await screen.findByRole('button', { name: 'Delete organization' })

      openDialog()

      expect(within(screen.getByRole('dialog')).getByText(/your only organization/)).toBeTruthy()
    })

    it('does not warn when they have others', async () => {
      signedIn()
      renderApp('/organizations/1/settings')
      await heading('Settings')
      await screen.findByRole('button', { name: 'Delete organization' })

      openDialog()

      expect(within(screen.getByRole('dialog')).queryByText(/your only organization/)).toBeNull()
    })

    it('does nothing when they cancel', async () => {
      const api = signedIn()
      renderApp('/organizations/1/settings')
      await heading('Settings')
      await screen.findByRole('button', { name: 'Delete organization' })
      openDialog()

      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))

      expect(api.count('DELETE /api/organizations/1')).toBe(0)
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  describe('deleting it', () => {
    it('deletes the organization of the page, not another one the person also owns', async () => {
      const api = signedIn()
      renderApp('/organizations/4/settings')
      await heading('Settings')
      await screen.findByRole('button', { name: 'Delete organization' })
      openDialog()

      confirm()

      await waitFor(() => expect(api.count('DELETE /api/organizations/4')).toBe(1))
      expect(api.count('DELETE /api/organizations/1')).toBe(0)
    })

    it('brings the person to another of their organizations, which no longer lists the deleted one', async () => {
      signedIn()
      renderApp('/organizations/4/settings')
      await heading('Settings')
      await screen.findByRole('button', { name: 'Delete organization' })
      openDialog()

      confirm()

      // Their first organization, empty: "Press start"
      await heading('Press start')
      const box = screen.getByTitle('Switch organization')
      await waitFor(() => expect(within(box).getByText("Ana's space")).toBeTruthy())
      const menu = box.parentElement!
      expect(within(menu).queryByText('Night Owls Games')).toBeNull()
    })

    it('does not ask the API about the organization that was just deleted', async () => {
      const api = signedIn()
      renderApp('/organizations/4/settings')
      await heading('Settings')
      await screen.findByRole('button', { name: 'Delete organization' })
      openDialog()
      const before = api.requests.length

      confirm()
      await heading('Press start')

      // Nothing asked after the delete went to /api/organizations/4... (it would be a 404)
      const after = api.requests.slice(before).filter((request) => request.method !== 'DELETE')
      expect(after.some((request) => request.path.startsWith('/api/organizations/4'))).toBe(false)
    })

    it('does not go back to the deleted one while the refreshed list is still on its way', async () => {
      // Right after the delete, the app still holds the OLD list (with the deleted organization in
      // it) until the new one arrives. The page it goes to must not be picked from the old one.
      let deleted = false
      const api = signedIn(undefined, {
        'GET /api/organizations': () =>
          deleted
            ? afterAWhile({ status: 200, body: [personal, joined, demo] }) // slow, and without it
            : { status: 200, body: [personal, studio, joined, demo] },
        'DELETE /api/organizations/4': () => {
          deleted = true
          return { status: 204 }
        },
      })
      renderApp('/organizations/4/settings') // so organization 4 is also the "last one used"
      await heading('Settings')
      await screen.findByRole('button', { name: 'Delete organization' })
      openDialog()
      const before = api.requests.length

      confirm()
      await heading('Press start') // her personal organization

      const after = api.requests.slice(before).filter((request) => request.method !== 'DELETE')
      expect(after.some((request) => request.path.startsWith('/api/organizations/4'))).toBe(false)
      expect(screen.queryByText('Organization not found')).toBeNull()
    })

    it('tells the person to create another one when it was the only organization', async () => {
      signedIn([personal])
      renderApp('/organizations/1/settings')
      await heading('Settings')
      await screen.findByRole('button', { name: 'Delete organization' })
      openDialog()

      confirm()

      await heading('No organization yet')
      // (the switcher's menu has a link too: this is the button on the page itself)
      expect(within(screen.getByRole('main')).getByRole('link', { name: /New organization/ })).toBeTruthy()
    })

    it('shows what the API says if it refuses (a project appeared in between), and keeps the dialog open', async () => {
      signedIn(undefined, {
        'DELETE /api/organizations/1': {
          status: 409,
          body: { title: 'Organization has projects', detail: 'Delete its projects before deleting the organization.' },
        },
      })
      renderApp('/organizations/1/settings')
      await heading('Settings')
      await screen.findByRole('button', { name: 'Delete organization' })
      openDialog()

      confirm()

      const dialog = screen.getByRole('dialog')
      expect(
        await within(dialog).findByText('Delete its projects before deleting the organization.'),
      ).toBeTruthy()
    })
  })
})
