import { vi } from 'vitest'

// What a fake endpoint answers. A function can decide from the request (e.g. check the token).
export interface FakeResponse {
  status: number
  body?: unknown
}

export interface FakeRequest {
  method: string
  path: string // "/api/auth/me", without the address in front
  search: string // the query string, like "?page=2" (empty when there is none)
  authorization: string | null // the "Authorization" header, if the request sent one
  body: unknown // the JSON the request sent, if any
}

type Handler = FakeResponse | ((request: FakeRequest) => FakeResponse)

// A stand-in for the real API. It replaces fetch, so the app code runs unchanged
// but nothing goes over the network. Routes are written as "METHOD /path".
export function installFakeApi(routes: Record<string, Handler>) {
  const requests: FakeRequest[] = []

  const fakeFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input))
    const headers = new Headers(init?.headers)
    const request: FakeRequest = {
      method: init?.method ?? 'GET',
      path: url.pathname,
      search: url.search,
      authorization: headers.get('Authorization'),
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    }
    requests.push(request)

    const handler = routes[`${request.method} ${request.path}`]
    if (!handler) {
      return new Response(JSON.stringify({ title: 'No fake route' }), { status: 404 })
    }

    const { status, body } = typeof handler === 'function' ? handler(request) : handler
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  })

  vi.stubGlobal('fetch', fakeFetch)

  return {
    requests,
    // How many requests went to a given route
    count: (route: string) =>
      requests.filter((request) => `${request.method} ${request.path}` === route).length,
  }
}

// Makes fetch fail the way it does when the server can't be reached at all
export function installUnreachableApi() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    }),
  )
}

export const ana = { id: 'user-1', email: 'ana@test.local', displayName: 'Ana' }

export function authResponse(token = 'token-for-ana', user = ana) {
  return { token, expiresAt: '2030-01-01T00:00:00+00:00', user }
}
