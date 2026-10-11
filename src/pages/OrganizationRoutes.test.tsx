import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setToken } from '../auth/tokenStorage'
import { getLastOrganizationId, setLastOrganizationId } from '../organizations/lastOrganization'
import { installFakeApi, organization, project } from '../test/fakeApi'
import { apiRoutes, heading, renderApp } from '../test/renderApp'

// A page of bugs, with only what the counts need
const bugsPage = (totalCount: number) => ({
  status: 200,
  body: { items: [], page: 1, pageSize: 1, totalCount },
})

// Ana belongs to her own organization (1) and to a studio (2), and has signed in
const personal = organization({ id: 1, name: "Ana's space", projectCount: 0 })
const studio = organization({ id: 2, name: 'Night Owls', myRole: 'Member', memberCount: 3, projectCount: 2 })

const pink = project({ id: 5, organizationId: 2, name: 'Pink in the Night', code: 'PIN', bugCount: 4 })
const neon = project({ id: 6, organizationId: 2, name: 'Neon Drifters', code: 'NEO', bugCount: 3, openCriticalCount: 1 })

function signedInWithTwoOrganizations(extra: Parameters<typeof installFakeApi>[0] = {}) {
  setToken('token-for-ana')
  return installFakeApi({
    ...apiRoutes,
    'GET /api/organizations': { status: 200, body: [personal, studio] },
    'GET /api/organizations/1/projects': { status: 200, body: [] },
    'GET /api/organizations/2/projects': { status: 200, body: [pink, neon] },
    ...extra,
  })
}

describe('the organization in the address', () => {
  describe('"/" ', () => {
    it('opens the first organization (the personal one) when there is no last one', async () => {
      signedInWithTwoOrganizations()

      renderApp('/')

      await heading('Press start') // her personal organization has no projects yet
    })

    it('opens the last organization used, when it is still hers', async () => {
      signedInWithTwoOrganizations()
      setLastOrganizationId(2)

      renderApp('/')

      await heading(/2 games in development/) // the studio has two projects
    })

    it('ignores a last organization that is not hers', async () => {
      signedInWithTwoOrganizations()
      setLastOrganizationId(99)

      renderApp('/')

      await heading('Press start')
    })

    it('says so when the person belongs to no organization', async () => {
      setToken('token-for-ana')
      installFakeApi({ ...apiRoutes, 'GET /api/organizations': { status: 200, body: [] } })

      renderApp('/')

      await heading('No organization yet')
    })
  })

  describe('the overview of an organization', () => {
    it('lists only the projects of that organization', async () => {
      const api = signedInWithTwoOrganizations({
        'GET /api/projects/5/bugs': bugsPage(2),
        'GET /api/projects/6/bugs': bugsPage(1),
      })

      renderApp('/organizations/2')

      await heading(/2 games in development/)
      const rows = screen.getAllByRole('link', { name: /Pink in the Night|Neon Drifters/ })
      expect(rows.length).toBeGreaterThanOrEqual(2)
      expect(api.count('GET /api/organizations/2/projects')).toBe(1) // shared with the sidebar
      expect(api.count('GET /api/organizations/1/projects')).toBe(0)
    })

    it('adds up the open bugs of ITS projects only, not of every organization she is in', async () => {
      signedInWithTwoOrganizations({
        'GET /api/projects/5/bugs': bugsPage(2),
        'GET /api/projects/6/bugs': bugsPage(1),
        // The search across everything would answer 99: it must not be used for this number
        'GET /api/bugs': bugsPage(99),
      })

      renderApp('/organizations/2')

      const openBugs = (await screen.findByText('Open bugs')).closest('.stat')!
      await waitFor(() => expect(within(openBugs as HTMLElement).getByText('3')).toBeTruthy())
    })

    it('goes straight to the project when the organization has just one', async () => {
      signedInWithTwoOrganizations({
        'GET /api/organizations/2/projects': { status: 200, body: [pink] },
        'GET /api/projects/5': { status: 200, body: pink },
        'GET /api/projects/5/bugs': bugsPage(0),
      })

      renderApp('/organizations/2')

      await heading('Pink in the Night')
    })

    it.each(['/organizations/99', '/organizations/abc', '/organizations/0'])(
      'says "not found" for %s, which is not an organization of hers',
      async (address) => {
        signedInWithTwoOrganizations({ 'GET /api/organizations/99/projects': { status: 404 } })

        renderApp(address)

        await heading('Organization not found')
      },
    )
  })

  describe('creating a project', () => {
    it('creates it in the organization of the address, not in another one', async () => {
      const api = signedInWithTwoOrganizations({
        'POST /api/organizations/2/projects': { status: 201, body: pink },
        'GET /api/projects/5': { status: 200, body: pink },
        'GET /api/projects/5/bugs': bugsPage(0),
      })
      renderApp('/organizations/2/projects/new')
      await heading('New project')

      fireEvent.input(screen.getByLabelText('Game name'), { target: { value: 'Pink in the Night' } })
      fireEvent.click(screen.getByRole('button', { name: 'Create project' }))

      await heading('Pink in the Night')
      expect(api.count('POST /api/organizations/2/projects')).toBe(1)
      expect(api.count('POST /api/organizations/1/projects')).toBe(0)
    })

    it('says "not found" for an address with no valid organization', async () => {
      signedInWithTwoOrganizations()

      renderApp('/organizations/abc/projects/new')

      await heading('Organization not found')
    })
  })

  describe('inside a project', () => {
    it('shows the projects of the project’s own organization in the sidebar', async () => {
      // She has the personal organization (1) saved as the last one, but the project is in 2
      setLastOrganizationId(1)
      const api = signedInWithTwoOrganizations({
        'GET /api/projects/5': { status: 200, body: pink },
        'GET /api/projects/5/bugs': bugsPage(0),
      })

      renderApp('/projects/5')

      await heading('Pink in the Night')
      await waitFor(() => expect(api.count('GET /api/organizations/2/projects')).toBe(1))
      // …and never asked for the other organization's projects to fill the sidebar
      expect(api.count('GET /api/organizations/1/projects')).toBe(0)
      expect(screen.getAllByText('Neon Drifters').length).toBeGreaterThan(0) // the other project of 2
    })

    it('finds the organization of a bug through its project', async () => {
      const api = signedInWithTwoOrganizations({
        'GET /api/bugs/7': {
          status: 200,
          body: {
            id: 7,
            projectId: 5,
            title: 'Neon sign flickers',
            description: 'It flickers too fast.',
            severity: 'High',
            status: 'Open',
            createdAt: '2026-10-03T10:00:00+00:00',
          },
        },
        'GET /api/projects/5': { status: 200, body: pink },
      })

      renderApp('/bugs/7')

      await heading('Neon sign flickers')
      await waitFor(() => expect(api.count('GET /api/organizations/2/projects')).toBe(1))
      expect(api.count('GET /api/organizations/1/projects')).toBe(0)
    })
  })

  describe('remembering the organization', () => {
    it('saves the one the person is working in, so the app opens there next time', async () => {
      signedInWithTwoOrganizations()

      renderApp('/organizations/2')
      await heading(/2 games in development/)

      await waitFor(() => expect(getLastOrganizationId()).toBe(2))
    })

    it('does not save an address that is not one of hers', async () => {
      signedInWithTwoOrganizations({ 'GET /api/organizations/99/projects': { status: 404 } })

      renderApp('/organizations/99')
      await heading('Organization not found')

      expect(getLastOrganizationId()).toBeNull()
    })
  })
})
