import { describe, expect, it } from 'vitest'
import { installFakeApi } from '../test/fakeApi'
import { ApiError } from './client'
import { getDemoInfo } from './demo'
import {
  addMember,
  createOrganization,
  deleteOrganization,
  getMembers,
  getOrganization,
  getOrganizations,
  organizationKeys,
  removeMember,
  renameOrganization,
} from './organizations'
import { createOrganizationProject, getOrganizationProjects, projectKeys } from './projects'

// These check that each function talks to the right route of the API, the right way:
// the method, the address and what is sent in the body.
describe('the organization API', () => {
  describe('organizations', () => {
    it('lists the ones the person belongs to', async () => {
      const api = installFakeApi({ 'GET /api/organizations': { status: 200, body: [] } })

      expect(await getOrganizations()).toEqual([])

      expect(api.count('GET /api/organizations')).toBe(1)
    })

    it('gets one by its id', async () => {
      const organization = { id: 3, name: 'Night Owls' }
      const api = installFakeApi({ 'GET /api/organizations/3': { status: 200, body: organization } })

      expect(await getOrganization(3)).toEqual(organization)

      expect(api.requests[0].path).toBe('/api/organizations/3')
    })

    it('fails with an ApiError (404) for one that is not the person’s', async () => {
      installFakeApi({ 'GET /api/organizations/9': { status: 404 } })

      await expect(getOrganization(9)).rejects.toMatchObject({
        status: 404,
        name: ApiError.name,
      })
    })

    it('creates one by POSTing its name', async () => {
      const api = installFakeApi({ 'POST /api/organizations': { status: 201, body: { id: 5 } } })

      await createOrganization({ name: 'Night Owls' })

      expect(api.requests[0].body).toEqual({ name: 'Night Owls' })
    })

    it('renames one with a PUT to its address', async () => {
      const api = installFakeApi({ 'PUT /api/organizations/5': { status: 200, body: { id: 5 } } })

      await renameOrganization(5, { name: 'Night Owls Games' })

      expect(api.requests[0].body).toEqual({ name: 'Night Owls Games' })
    })

    it('deletes one with a DELETE (and a 204 has no body to read)', async () => {
      const api = installFakeApi({ 'DELETE /api/organizations/5': { status: 204 } })

      await expect(deleteOrganization(5)).resolves.toBeUndefined()

      expect(api.count('DELETE /api/organizations/5')).toBe(1)
    })
  })

  describe('members', () => {
    it('lists the people of an organization', async () => {
      const api = installFakeApi({
        'GET /api/organizations/3/members': { status: 200, body: [{ userId: 'u1' }] },
      })

      expect(await getMembers(3)).toEqual([{ userId: 'u1' }])

      expect(api.requests[0].path).toBe('/api/organizations/3/members')
    })

    it('adds someone by POSTing their email', async () => {
      const api = installFakeApi({
        'POST /api/organizations/3/members': { status: 201, body: { userId: 'u2' } },
      })

      await addMember(3, { email: 'ben@test.local' })

      expect(api.requests[0].body).toEqual({ email: 'ben@test.local' })
    })

    it('keeps the message the API puts on the "email" field when nobody has that email', async () => {
      installFakeApi({
        'POST /api/organizations/3/members': {
          status: 404,
          body: { title: 'No account with this email', errors: { Email: ['Nobody has signed up yet.'] } },
        },
      })

      const error = await addMember(3, { email: 'nobody@test.local' }).catch((e: ApiError) => e)

      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).status).toBe(404)
      expect((error as ApiError).fieldErrors.email).toEqual(['Nobody has signed up yet.'])
    })

    it('removes someone with a DELETE to their address', async () => {
      const api = installFakeApi({
        'DELETE /api/organizations/3/members/user-7': { status: 204 },
      })

      await removeMember(3, 'user-7')

      expect(api.count('DELETE /api/organizations/3/members/user-7')).toBe(1)
    })
  })

  describe('projects of an organization', () => {
    it('lists them from the organization’s own address', async () => {
      const api = installFakeApi({
        'GET /api/organizations/3/projects': { status: 200, body: [{ id: 1 }] },
      })

      expect(await getOrganizationProjects(3)).toEqual([{ id: 1 }])

      expect(api.requests[0].path).toBe('/api/organizations/3/projects')
    })

    it('creates one inside the organization', async () => {
      const api = installFakeApi({
        'POST /api/organizations/3/projects': { status: 201, body: { id: 8 } },
      })

      await createOrganizationProject(3, { name: 'Pink in the Night', code: 'PIN' })

      expect(api.requests[0].body).toEqual({ name: 'Pink in the Night', code: 'PIN' })
    })
  })

  describe('the demo', () => {
    it('is asked for without a token: it is for people who have not signed in', async () => {
      const api = installFakeApi({
        'GET /api/demo': { status: 200, body: { organizationName: 'Demo', password: 'x', accounts: [] } },
      })

      await getDemoInfo()

      expect(api.requests[0].authorization).toBeNull()
    })

    it('fails with a 404 ApiError when the API has no demo', async () => {
      installFakeApi({ 'GET /api/demo': { status: 404 } })

      await expect(getDemoInfo()).rejects.toMatchObject({ status: 404 })
    })
  })

  describe('cache keys', () => {
    it('keep the list, one organization and its members apart, but under one prefix', () => {
      expect(organizationKeys.all).toEqual(['organizations'])
      expect(organizationKeys.detail(3)).toEqual(['organizations', 3])
      expect(organizationKeys.members(3)).toEqual(['organizations', 3, 'members'])
    })

    it('do not mix the projects of an organization with one project (even if the numbers match)', () => {
      expect(projectKeys.ofOrganization(3)).not.toEqual(projectKeys.detail(3))
      // …but both start with ['projects'], so invalidating projectKeys.all reaches them
      expect(projectKeys.ofOrganization(3).slice(0, 1)).toEqual(projectKeys.all)
      expect(projectKeys.detail(3).slice(0, 1)).toEqual(projectKeys.all)
    })
  })
})
