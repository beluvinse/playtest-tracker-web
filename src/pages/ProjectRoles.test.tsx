import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setToken } from '../auth/tokenStorage'
import { installFakeApi, organization, project } from '../test/fakeApi'
import { apiRoutes, heading, renderApp } from '../test/renderApp'

// Ana owns her own organization (1) and is only a Member of the studio (2)
const personal = organization({ id: 1, name: "Ana's space", myRole: 'Owner' })
const studio = organization({ id: 2, name: 'Night Owls', myRole: 'Member' })

const ownProject = project({ id: 4, organizationId: 1, name: 'My own game', code: 'OWN' })
const studiosProject = project({ id: 5, organizationId: 2, name: 'Pink in the Night', code: 'PIN' })

const emptyPage = { status: 200, body: { items: [], page: 1, pageSize: 10, totalCount: 0 } }

// The sidebar names the organization once the list of them has loaded: from then on the role is known
async function organizationsLoaded() {
  await within(screen.getByTitle('Switch organization')).findByText('Night Owls')
}

function signedIn(extra: Parameters<typeof installFakeApi>[0] = {}) {
  setToken('token-for-ana')
  installFakeApi({
    ...apiRoutes,
    'GET /api/organizations': { status: 200, body: [personal, studio] },
    'GET /api/organizations/1/projects': { status: 200, body: [ownProject] },
    'GET /api/organizations/2/projects': { status: 200, body: [studiosProject] },
    'GET /api/projects/4': { status: 200, body: ownProject },
    'GET /api/projects/5': { status: 200, body: studiosProject },
    'GET /api/projects/4/bugs': emptyPage,
    'GET /api/projects/5/bugs': emptyPage,
    ...extra,
  })
}

describe('what a project page offers, by role', () => {
  it('the Owner of the organization can delete its projects', async () => {
    signedIn()

    renderApp('/projects/4')
    await heading('My own game')

    expect(await screen.findByRole('button', { name: 'Delete' })).toBeTruthy()
  })

  it('a Member cannot, even if they own another organization: the button is not even offered', async () => {
    signedIn()

    renderApp('/projects/5') // a project of the studio, where she is only a Member
    await heading('Pink in the Night')
    await organizationsLoaded()

    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull()
  })

  it('still lets a Member edit it and report bugs', async () => {
    signedIn()

    renderApp('/projects/5')
    await heading('Pink in the Night')

    expect(await screen.findByRole('button', { name: 'Edit' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Report bug/ })).toBeTruthy()
  })

  it('does not offer it while the role is unknown (here the organizations could not be loaded)', async () => {
    signedIn({ 'GET /api/organizations': { status: 500, body: { title: 'Something broke' } } })

    renderApp('/projects/4') // her own project: she would be the Owner, if it were known
    await heading('My own game')
    await screen.findByRole('button', { name: 'Edit' }) // the page is fully there

    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull()
  })
})
