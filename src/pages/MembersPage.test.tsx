import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setToken } from '../auth/tokenStorage'
import { installFakeApi, member, organization } from '../test/fakeApi'
import { apiRoutes, heading, renderApp } from '../test/renderApp'

// Ana (user-1) is in her own organization (1) and in a studio (2) where Luna is the Owner
const personal = organization({ id: 1, name: "Ana's space", memberCount: 1 })
const studio = organization({ id: 2, name: 'Night Owls', myRole: 'Member', memberCount: 3 })

const luna = member({ userId: 'user-9', displayName: 'Luna Park', email: 'luna@test.local', role: 'Owner' })
const ana = member({ userId: 'user-1', displayName: 'Ana', email: 'ana@test.local', role: 'Member' })
const ben = member({ userId: 'user-5', displayName: 'Ben Ortiz', email: 'ben@test.local', role: 'Member' })

function signedIn(extra: Parameters<typeof installFakeApi>[0] = {}) {
  setToken('token-for-ana')
  return installFakeApi({
    ...apiRoutes,
    'GET /api/organizations': { status: 200, body: [personal, studio] },
    'GET /api/organizations/1/projects': { status: 200, body: [] },
    'GET /api/organizations/2/projects': { status: 200, body: [] },
    'GET /api/organizations/2/members': { status: 200, body: [luna, ana, ben] },
    ...extra,
  })
}

describe('the people of an organization', () => {
  it('lists everybody, with their email and role, the Owner first as the API sends them', async () => {
    signedIn()

    renderApp('/organizations/2/members')

    await heading('People')
    const rows = screen.getAllByRole('listitem').filter((row) => row.classList.contains('member-row'))
    expect(rows).toHaveLength(3)
    expect(within(rows[0]).getByText('Luna Park')).toBeTruthy()
    expect(within(rows[0]).getByText('luna@test.local')).toBeTruthy()
    expect(within(rows[0]).getByText('Owner')).toBeTruthy()
    expect(within(rows[1]).getByText('Member')).toBeTruthy()
  })

  it('marks the person who is looking, so they find themselves', async () => {
    signedIn()

    renderApp('/organizations/2/members')
    await heading('People')

    const you = screen.getAllByText('you')
    expect(you).toHaveLength(1)
    expect(you[0].closest('li')?.textContent).toContain('Ana')
  })

  it('says how many people there are, in the singular too', async () => {
    signedIn({ 'GET /api/organizations/1/members': { status: 200, body: [member({ role: 'Owner' })] } })

    renderApp('/organizations/1/members')

    await heading('People')
    expect(screen.getByText('1 member')).toBeTruthy()
  })

  it('says how many there are when there are several', async () => {
    signedIn()

    renderApp('/organizations/2/members')

    await heading('People')
    expect(screen.getByText('3 members')).toBeTruthy()
  })

  it('names the organization they belong to', async () => {
    signedIn()

    renderApp('/organizations/2/members')

    await heading('People')
    expect(await screen.findByText('Night Owls · people')).toBeTruthy()
  })

  describe('the sidebar', () => {
    it('has a "People" link with the number of people, leading to this page', async () => {
      signedIn()

      renderApp('/organizations/2/members')
      await heading('People')

      const link = screen.getByRole('link', { name: /People/ })
      expect(link.getAttribute('href')).toBe('/organizations/2/members')
      expect(link.textContent).toContain('3')
    })

    it('is also there on the overview, pointing to the organization we are in', async () => {
      signedIn()

      renderApp('/organizations/2')
      await heading('Press start') // no projects yet

      const link = await screen.findByRole('link', { name: /People/ })
      expect(link.getAttribute('href')).toBe('/organizations/2/members')
    })

    it('calls the page "people" in the breadcrumb', async () => {
      signedIn()

      renderApp('/organizations/2/members')
      await heading('People')

      const breadcrumb = screen.getByRole('navigation', { name: 'Location' })
      expect(within(breadcrumb).getByText('people')).toBeTruthy()
    })

    it('has no "People" link for an organization that is not hers', async () => {
      signedIn({ 'GET /api/organizations/99/members': { status: 404 } })

      renderApp('/organizations/99/members')
      await heading('Organization not found')

      expect(screen.queryByRole('link', { name: /People/ })).toBeNull()
    })
  })

  describe('when it cannot be shown', () => {
    it.each(['/organizations/99/members', '/organizations/abc/members'])(
      'says "not found" for %s, which is not an organization of hers',
      async (address) => {
        const api = signedIn({ 'GET /api/organizations/99/members': { status: 404 } })

        renderApp(address)

        await heading('Organization not found')
        // An address that is not even a number never reaches the API ("/organizations/NaN/members")
        expect(api.requests.some((request) => request.path.includes('NaN'))).toBe(false)
      },
    )

    it('shows the error when the API fails', async () => {
      signedIn({
        'GET /api/organizations/2/members': { status: 500, body: { title: 'Something broke' } },
      })

      renderApp('/organizations/2/members')

      expect(await screen.findByText('Something broke')).toBeTruthy()
    })
  })
})

// The example organization has many people (every visitor who signs up joins it), so the list
// comes one page at a time
describe('a long list of people', () => {
  const studio25 = organization({ id: 2, name: 'Night Owls', myRole: 'Member', memberCount: 25 })
  const everybody = Array.from({ length: 25 }, (_, index) =>
    member({
      userId: `user-${index + 20}`,
      displayName: `Person ${index + 1}`,
      email: `person${index + 1}@test.local`,
      role: index === 0 ? 'Owner' : 'Member',
    }),
  )

  // Answers like the API: the page and pageSize that were asked for
  function paged(request: { search: string }) {
    const query = new URLSearchParams(request.search)
    const page = Number(query.get('page') ?? 1)
    const pageSize = Number(query.get('pageSize') ?? 10)
    return {
      status: 200,
      body: {
        items: everybody.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        totalCount: everybody.length,
      },
    }
  }

  function signedInWithMany() {
    setToken('token-for-ana')
    return installFakeApi({
      ...apiRoutes,
      'GET /api/organizations': { status: 200, body: [studio25] },
      'GET /api/organizations/2/projects': { status: 200, body: [] },
      'GET /api/organizations/2/members': paged,
    })
  }

  const rows = () => screen.getAllByRole('listitem').filter((row) => row.classList.contains('member-row'))

  it('shows the first ten, and says how many there are in total', async () => {
    const api = signedInWithMany()

    renderApp('/organizations/2/members')

    await heading('People')
    expect(rows()).toHaveLength(10)
    expect(screen.getByText('25 members')).toBeTruthy()
    expect(screen.getByText(/1–10 of 25/)).toBeTruthy()
    expect(api.requests.some((r) => r.search === '?page=1&pageSize=10')).toBe(true)
  })

  it('goes to the next page and shows the next ten', async () => {
    const api = signedInWithMany()
    renderApp('/organizations/2/members')
    await heading('People')

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))

    expect(await screen.findByText('Person 11')).toBeTruthy()
    expect(screen.queryByText('Person 1')).toBeNull()
    expect(screen.getByText(/11–20 of 25/)).toBeTruthy()
    expect(api.requests.some((r) => r.search === '?page=2&pageSize=10')).toBe(true)
  })

  it('opens straight on the page in the address, with a short last page', async () => {
    signedInWithMany()

    renderApp('/organizations/2/members?page=3')

    await screen.findByText('Person 21')
    expect(rows()).toHaveLength(5)
    expect(screen.getByText(/21–25 of 25/)).toBeTruthy()
  })

  it('offers a way back when the page is past the end', async () => {
    signedInWithMany()

    renderApp('/organizations/2/members?page=9')

    fireEvent.click(await screen.findByRole('button', { name: 'Go to the first page' }))

    await waitFor(() => expect(screen.getByText('Person 1')).toBeTruthy())
    expect(rows()).toHaveLength(10)
  })

  it('shows no page controls when everybody fits on one page', async () => {
    setToken('token-for-ana')
    installFakeApi({
      ...apiRoutes,
      'GET /api/organizations': { status: 200, body: [personal, studio] },
      'GET /api/organizations/2/projects': { status: 200, body: [] },
      'GET /api/organizations/2/members': {
        status: 200,
        body: { items: [luna, ana, ben], page: 1, pageSize: 10, totalCount: 3 },
      },
    })

    renderApp('/organizations/2/members')

    await heading('People')
    expect(rows()).toHaveLength(3)
    expect(screen.queryByRole('navigation', { name: 'People pages' })).toBeNull()
  })
})
