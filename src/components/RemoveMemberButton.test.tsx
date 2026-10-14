import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { MemberDto } from '../api/types'
import { setToken } from '../auth/tokenStorage'
import { installFakeApi, member, organization } from '../test/fakeApi'
import { apiRoutes, heading, renderApp } from '../test/renderApp'

// The browser's own <dialog> methods aren't in jsdom: these do what they do (open / close it)
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})

const mine = organization({ id: 1, name: "Ana's space", myRole: 'Owner', memberCount: 3 })
const studio = organization({ id: 2, name: 'Night Owls', myRole: 'Member', memberCount: 2 })
const demo = organization({ id: 3, name: 'Demo Studio', myRole: 'Member', isDemo: true, memberCount: 3 })

const ana = member({ userId: 'user-1', displayName: 'Ana', email: 'ana@test.local', role: 'Owner' })
const anaAsMember = { ...ana, role: 'Member' } as MemberDto
const luna = member({ userId: 'user-9', displayName: 'Luna Park', email: 'luna@test.local', role: 'Owner' })
const ben = member({ userId: 'user-5', displayName: 'Ben Ortiz', email: 'ben@test.local', role: 'Member' })
const cleo = member({ userId: 'user-6', displayName: 'Cleo Ruiz', email: 'cleo@test.local', role: 'Member' })

// Ana's organization (1) has three people; she owns it. In the studio (2) she is a Member.
// The API answers with whoever is still there, like the real one.
function signedIn(extra: Parameters<typeof installFakeApi>[0] = {}) {
  let ownPeople: MemberDto[] = [ana, ben, cleo]
  let organizations = [mine, studio, demo]
  setToken('token-for-ana')
  return installFakeApi({
    ...apiRoutes,
    'GET /api/organizations': () => ({
      status: 200,
      body: organizations.map((o) => (o.id === 1 ? { ...o, memberCount: ownPeople.length } : o)),
    }),
    'GET /api/organizations/1/projects': { status: 200, body: [] },
    'GET /api/organizations/1/members': () => ({ status: 200, body: ownPeople }),
    'DELETE /api/organizations/1/members/user-5': () => {
      ownPeople = ownPeople.filter((person) => person.userId !== 'user-5')
      return { status: 204 }
    },
    'GET /api/organizations/2/projects': { status: 200, body: [] },
    'GET /api/organizations/2/members': { status: 200, body: [luna, anaAsMember, ben] },
    'DELETE /api/organizations/2/members/user-1': () => {
      organizations = organizations.filter((o) => o.id !== 2) // she is out: it is no longer hers
      return { status: 204 }
    },
    'GET /api/organizations/3/projects': { status: 200, body: [] },
    'GET /api/organizations/3/members': { status: 200, body: [luna, anaAsMember, ben] },
    ...extra,
  })
}

describe('removing people and leaving', () => {
  describe('who gets which button', () => {
    it('the Owner can remove each Member, but has nothing on their own row', async () => {
      signedIn()

      renderApp('/organizations/1/members')
      await heading('People')

      expect(await screen.findByRole('button', { name: 'Remove Ben Ortiz' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Remove Cleo Ruiz' })).toBeTruthy()
      // two buttons, not three: the Owner (Ana, "you") can't be removed or leave
      expect(screen.getAllByRole('button', { name: /^(Remove|Leave) / })).toHaveLength(2)
    })

    it('a Member can only leave, from their own row', async () => {
      signedIn()

      renderApp('/organizations/2/members')
      await heading('People')

      expect(await screen.findByRole('button', { name: 'Leave Night Owls' })).toBeTruthy()
      expect(screen.queryByRole('button', { name: /^Remove / })).toBeNull()
      expect(screen.getAllByRole('button', { name: /^(Remove|Leave) / })).toHaveLength(1)
    })

    it('nobody in the example organization', async () => {
      signedIn()

      renderApp('/organizations/3/members')
      await heading('People')
      await screen.findByText(/example organization/)

      expect(screen.queryByRole('button', { name: /^(Remove|Leave) / })).toBeNull()
    })
  })

  describe('removing a Member', () => {
    it('asks first, and says who and what changes', async () => {
      signedIn()
      renderApp('/organizations/1/members')
      await heading('People')

      fireEvent.click(await screen.findByRole('button', { name: 'Remove Ben Ortiz' }))

      const dialog = screen.getByRole('dialog', { name: 'Remove Ben Ortiz?' })
      expect(within(dialog).getByText(/will lose access/)).toBeTruthy()
    })

    it('does nothing when they cancel', async () => {
      const api = signedIn()
      renderApp('/organizations/1/members')
      await heading('People')
      fireEvent.click(await screen.findByRole('button', { name: 'Remove Ben Ortiz' }))

      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))

      expect(api.count('DELETE /api/organizations/1/members/user-5')).toBe(0)
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('removes them once confirmed: gone from the list and from the count in the sidebar', async () => {
      const api = signedIn()
      renderApp('/organizations/1/members')
      await heading('People')
      expect((await screen.findByRole('link', { name: /People/ })).textContent).toContain('3')
      fireEvent.click(screen.getByRole('button', { name: 'Remove Ben Ortiz' }))

      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes, remove' }))

      await waitFor(() => expect(screen.queryByText('Ben Ortiz')).toBeNull())
      expect(api.count('DELETE /api/organizations/1/members/user-5')).toBe(1)
      expect(screen.getByText('Cleo Ruiz')).toBeTruthy() // the others stay
      await waitFor(() =>
        expect(screen.getByRole('link', { name: /People/ }).textContent).toContain('2'),
      )
    })

    it('shows what the API says when it refuses, and keeps the dialog open', async () => {
      signedIn({
        'DELETE /api/organizations/1/members/user-5': {
          status: 403,
          body: { title: 'Only the owner can remove other people' },
        },
      })
      renderApp('/organizations/1/members')
      await heading('People')
      fireEvent.click(await screen.findByRole('button', { name: 'Remove Ben Ortiz' }))

      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes, remove' }))

      const dialog = screen.getByRole('dialog')
      expect(await within(dialog).findByText('Only the owner can remove other people')).toBeTruthy()
      expect(screen.getByText('Ben Ortiz')).toBeTruthy() // still there
    })
  })

  describe('leaving', () => {
    it('asks first, in terms of the organization', async () => {
      signedIn()
      renderApp('/organizations/2/members')
      await heading('People')

      fireEvent.click(await screen.findByRole('button', { name: 'Leave Night Owls' }))

      const dialog = screen.getByRole('dialog', { name: 'Leave Night Owls?' })
      expect(within(dialog).getByText(/The owner can add you back/)).toBeTruthy()
    })

    it('takes the person out and brings them to one of their other organizations', async () => {
      const api = signedIn()
      renderApp('/organizations/2/members')
      await heading('People')
      fireEvent.click(await screen.findByRole('button', { name: 'Leave Night Owls' }))

      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes, leave' }))

      // Her personal organization has no projects: "Press start"
      await heading('Press start')
      expect(api.count('DELETE /api/organizations/2/members/user-1')).toBe(1)
    })

    it('does not ask for the organization she left again', async () => {
      const api = signedIn()
      renderApp('/organizations/2/members')
      await heading('People')
      fireEvent.click(await screen.findByRole('button', { name: 'Leave Night Owls' }))
      const askedBefore = api.count('GET /api/organizations/2/members')

      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes, leave' }))
      await heading('Press start')

      // no page tried to load the people of an organization that is no longer hers (it would be a 404)
      expect(api.count('GET /api/organizations/2/members')).toBe(askedBefore)
    })

    it('no longer lists the organization she left in the switcher', async () => {
      signedIn()
      renderApp('/organizations/2/members')
      await heading('People')
      fireEvent.click(await screen.findByRole('button', { name: 'Leave Night Owls' }))

      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes, leave' }))
      await heading('Press start')

      const switcher = screen.getByTitle('Switch organization').parentElement!
      await waitFor(() => expect(within(switcher).queryByText('Night Owls')).toBeNull())
    })
  })
})
