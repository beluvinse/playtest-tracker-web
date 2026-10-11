import { describe, expect, it, vi } from 'vitest'
import { getToken, setToken } from '../auth/tokenStorage'
import { installFakeApi } from '../test/fakeApi'
import { ApiError, apiRequest, setUnauthorizedHandler } from './client'

describe('apiRequest', () => {
  describe('the login token', () => {
    it('is sent on every request when there is one', async () => {
      const api = installFakeApi({ 'GET /api/projects': { status: 200, body: [] } })
      setToken('my-token')

      await apiRequest('/api/projects')

      expect(api.requests[0].authorization).toBe('Bearer my-token')
    })

    it('is left out when there is none', async () => {
      const api = installFakeApi({ 'GET /api/projects': { status: 200, body: [] } })

      await apiRequest('/api/projects')

      expect(api.requests[0].authorization).toBeNull()
    })
  })

  describe('when the API answers 401', () => {
    it('ends the session if the request carried a token: clears it and tells the app', async () => {
      installFakeApi({ 'GET /api/projects': { status: 401 } })
      const onUnauthorized = vi.fn()
      setUnauthorizedHandler(onUnauthorized)
      setToken('expired-token')

      await expect(apiRequest('/api/projects')).rejects.toMatchObject({ status: 401 })

      expect(getToken()).toBeNull()
      expect(onUnauthorized).toHaveBeenCalledTimes(1)
      setUnauthorizedHandler(null)
    })

    it('does NOT end anything if there was no token: it is just a failed login', async () => {
      installFakeApi({
        'POST /api/auth/login': { status: 401, body: { title: 'Invalid email or password' } },
      })
      const onUnauthorized = vi.fn()
      setUnauthorizedHandler(onUnauthorized)

      await expect(
        apiRequest('/api/auth/login', { method: 'POST', body: { email: 'a', password: 'b' } }),
      ).rejects.toMatchObject({ status: 401, message: 'Invalid email or password' })

      expect(onUnauthorized).not.toHaveBeenCalled()
      setUnauthorizedHandler(null)
    })

    it('ignores a late 401 meant for an OLD token, so it cannot end the NEW session', async () => {
      installFakeApi({ 'GET /api/projects': { status: 401 } })
      const onUnauthorized = vi.fn()
      setUnauthorizedHandler(onUnauthorized)
      setToken('old-token')

      // The request leaves with the old token; before the answer comes back, the person logs in again
      const late = apiRequest('/api/projects')
      setToken('new-token')
      await late.catch(() => undefined)

      expect(getToken()).toBe('new-token')
      expect(onUnauthorized).not.toHaveBeenCalled()
      setUnauthorizedHandler(null)
    })
  })

  describe('requests and responses', () => {
    it('sends the body as JSON, and only sets the content type when there is a body', async () => {
      const api = installFakeApi({
        'POST /api/projects': { status: 201, body: { id: 1 } },
        'GET /api/projects': { status: 200, body: [] },
      })

      await apiRequest('/api/projects', { method: 'POST', body: { name: 'Pinball' } })
      await apiRequest('/api/projects')

      expect(api.requests[0].body).toEqual({ name: 'Pinball' })
      expect(api.requests[1].body).toBeUndefined()
    })

    it('leaves empty values out of the query string', async () => {
      const api = installFakeApi({ 'GET /api/bugs': { status: 200, body: [] } })

      await apiRequest('/api/bugs', { query: { page: 2, search: '', status: undefined } })

      expect(api.requests[0].search).toBe('?page=2')
    })

    it('returns undefined for 204 No Content', async () => {
      installFakeApi({ 'DELETE /api/bugs/1': { status: 204 } })

      await expect(apiRequest('/api/bugs/1', { method: 'DELETE' })).resolves.toBeUndefined()
    })

    it('throws an ApiError whose message comes from the API when it explains the problem', async () => {
      installFakeApi({
        'GET /api/projects/9': { status: 404, body: { title: 'Not Found', detail: 'No such project' } },
      })

      const error = await apiRequest('/api/projects/9').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).status).toBe(404)
      expect((error as ApiError).message).toBe('No such project')
    })

    it('still throws an ApiError when the error has no JSON body', async () => {
      installFakeApi({ 'GET /api/projects/9': { status: 405 } })

      await expect(apiRequest('/api/projects/9')).rejects.toMatchObject({
        status: 405,
        message: 'Request failed with status 405',
      })
    })

    it('turns field names into camelCase so they match the request bodies', async () => {
      installFakeApi({
        'POST /api/auth/register': {
          status: 400,
          body: { errors: { Email: ['Taken'], DisplayName: ['Too short'] } },
        },
      })

      const error = (await apiRequest('/api/auth/register', { method: 'POST', body: {} }).catch(
        (e: unknown) => e,
      )) as ApiError

      expect(error.fieldErrors).toEqual({ email: ['Taken'], displayName: ['Too short'] })
    })
  })
})
