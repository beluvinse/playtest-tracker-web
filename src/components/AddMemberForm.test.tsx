import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { MemberDto } from '../api/types'
import { setToken } from '../auth/tokenStorage'
import { installFakeApi, member, organization } from '../test/fakeApi'
import { apiRoutes, heading, renderApp } from '../test/renderApp'

const mine = organization({ id: 1, name: "Ana's space", myRole: 'Owner', memberCount: 1 })
const studio = organization({ id: 2, name: 'Night Owls', myRole: 'Member', memberCount: 2 })
const demo = organization({ id: 3, name: 'Demo Studio', myRole: 'Owner', isDemo: true, memberCount: 5 })

const ana = member({ userId: 'user-1', displayName: 'Ana', email: 'ana@test.local', role: 'Owner' })
const luna = member({ userId: 'user-9', displayName: 'Luna Park', email: 'luna@test.local', role: 'Owner' })
const ben = member({ userId: 'user-5', displayName: 'Ben Ortiz', email: 'ben@test.local', role: 'Member' })

const label = 'Add someone by email'

// Ana's own organization (1), where she is the Owner and the only person so far.
// The list of people answers with whatever has been added so far, like the real API.
function signedInAsOwner(extra: Parameters<typeof installFakeApi>[0] = {}) {
  let people: MemberDto[] = [ana]
  setToken('token-for-ana')
  return installFakeApi({
    ...apiRoutes,
    'GET /api/organizations': () => ({
      status: 200,
      body: [{ ...mine, memberCount: people.length }, studio, demo],
    }),
    'GET /api/organizations/1/projects': { status: 200, body: [] },
    'GET /api/organizations/1/members': () => ({ status: 200, body: people }),
    'POST /api/organizations/1/members': () => {
      people = [...people, ben]
      return { status: 201, body: ben }
    },
    'GET /api/organizations/2/projects': { status: 200, body: [] },
    'GET /api/organizations/2/members': { status: 200, body: [luna, ana] },
    'GET /api/organizations/3/projects': { status: 200, body: [] },
    'GET /api/organizations/3/members': { status: 200, body: [luna, ana] },
    ...extra,
  })
}

function typeEmail(value: string) {
  fireEvent.input(screen.getByLabelText(label), { target: { value } })
}

describe('adding someone to an organization', () => {
  describe('who sees the form', () => {
    it('the Owner of an organization of their own', async () => {
      signedInAsOwner()

      renderApp('/organizations/1/members')

      await heading('People')
      expect(await screen.findByLabelText(label)).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy()
    })

    it('not a Member: they are told who can, instead', async () => {
      signedInAsOwner()

      renderApp('/organizations/2/members')

      await heading('People')
      expect(await screen.findByText(/Only the owner \(Luna Park\) can add people/)).toBeTruthy()
      expect(screen.queryByLabelText(label)).toBeNull()
    })

    it('nobody in the example organization, not even its Owner: it is told why', async () => {
      signedInAsOwner()

      renderApp('/organizations/3/members')

      await heading('People')
      expect(await screen.findByText(/example organization: its people are fixed/)).toBeTruthy()
      expect(screen.queryByLabelText(label)).toBeNull()
    })
  })

  describe('adding someone who has an account', () => {
    it('sends the email, and shows the person in the list', async () => {
      const api = signedInAsOwner()
      renderApp('/organizations/1/members')
      await heading('People')
      await screen.findByLabelText(label)

      // (spaces around an email can't even be typed: an email field removes them by itself)
      typeEmail('ben@test.local')
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      expect(await screen.findByText('Ben Ortiz')).toBeTruthy() // the list was refreshed
      expect(api.requests.find((request) => request.method === 'POST')?.body).toEqual({
        email: 'ben@test.local',
      })
    })

    it('adds to the organization of the page, not to another one the person also owns', async () => {
      const api = signedInAsOwner({
        'GET /api/organizations': {
          status: 200,
          body: [mine, organization({ id: 4, name: 'Night Owls Games', myRole: 'Owner' })],
        },
        'GET /api/organizations/4/projects': { status: 200, body: [] },
        'GET /api/organizations/4/members': { status: 200, body: [ana] },
        'POST /api/organizations/4/members': { status: 201, body: ben },
      })
      renderApp('/organizations/4/members')
      await heading('People')
      await screen.findByLabelText(label)

      typeEmail('ben@test.local')
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      await screen.findByRole('status')
      expect(api.count('POST /api/organizations/4/members')).toBe(1)
      expect(api.count('POST /api/organizations/1/members')).toBe(0)
    })

    it('says who was added, and empties the field to add another one', async () => {
      signedInAsOwner()
      renderApp('/organizations/1/members')
      await heading('People')
      await screen.findByLabelText(label)

      typeEmail('ben@test.local')
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      expect((await screen.findByRole('status')).textContent).toMatch(/Added Ben Ortiz/)
      expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe('')
    })

    it('updates the numbers around: the "People" count in the sidebar', async () => {
      signedInAsOwner()
      renderApp('/organizations/1/members')
      await heading('People')
      const link = await screen.findByRole('link', { name: /People/ })
      expect(link.textContent).toContain('1')
      await screen.findByLabelText(label)

      typeEmail('ben@test.local')
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      await waitFor(() => expect(screen.getByRole('link', { name: /People/ }).textContent).toContain('2'))
    })
  })

  describe('when it cannot be done', () => {
    it('asks for the email when it is empty, and asks the API nothing', async () => {
      const api = signedInAsOwner()
      renderApp('/organizations/1/members')
      await heading('People')
      await screen.findByLabelText(label)

      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      expect(screen.getByText('This field is required.')).toBeTruthy()
      expect(api.count('POST /api/organizations/1/members')).toBe(0)
    })

    it('says so when what was typed is not an email, and asks the API nothing', async () => {
      const api = signedInAsOwner()
      renderApp('/organizations/1/members')
      await heading('People')
      await screen.findByLabelText(label)

      typeEmail('ben@')
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      expect(screen.getByText('Enter a valid email address, like name@example.com.')).toBeTruthy()
      expect(api.count('POST /api/organizations/1/members')).toBe(0)
    })

    it('shows the API\'s message under the field when nobody has an account with that email', async () => {
      signedInAsOwner({
        'POST /api/organizations/1/members': {
          status: 404,
          body: {
            title: 'No account with this email',
            errors: { Email: ['Nobody has signed up with this email yet.'] },
          },
        },
      })
      renderApp('/organizations/1/members')
      await heading('People')
      await screen.findByLabelText(label)

      typeEmail('nobody@test.local')
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      expect(await screen.findByText('Nobody has signed up with this email yet.')).toBeTruthy()
      expect(screen.getByLabelText(label).getAttribute('aria-invalid')).toBe('true')
    })

    it('shows the API\'s message when that person is already in', async () => {
      signedInAsOwner({
        'POST /api/organizations/1/members': {
          status: 409,
          body: {
            title: 'Already a member',
            errors: { Email: ['This person is already in the organization.'] },
          },
        },
      })
      renderApp('/organizations/1/members')
      await heading('People')
      await screen.findByLabelText(label)

      typeEmail('ana@test.local')
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      expect(await screen.findByText('This person is already in the organization.')).toBeTruthy()
    })

    it('forgets the API\'s message as soon as they change the email', async () => {
      signedInAsOwner({
        'POST /api/organizations/1/members': {
          status: 404,
          body: { title: 'No account', errors: { Email: ['Nobody has signed up with this email yet.'] } },
        },
      })
      renderApp('/organizations/1/members')
      await heading('People')
      await screen.findByLabelText(label)
      typeEmail('nobody@test.local')
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))
      await screen.findByText('Nobody has signed up with this email yet.')

      typeEmail('nobody@test.loca')

      expect(screen.queryByText('Nobody has signed up with this email yet.')).toBeNull()
    })

    it('shows an error that is not about the field in a box, and keeps what was typed', async () => {
      signedInAsOwner({
        'POST /api/organizations/1/members': { status: 500, body: { title: 'Something broke' } },
      })
      renderApp('/organizations/1/members')
      await heading('People')
      await screen.findByLabelText(label)

      typeEmail('ben@test.local')
      fireEvent.click(screen.getByRole('button', { name: 'Add' }))

      expect(await screen.findByText('Something broke')).toBeTruthy()
      expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe('ben@test.local')
    })
  })
})
