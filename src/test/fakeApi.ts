import { vi } from 'vitest'
import type { DemoInfoDto, MemberDto, OrganizationDto, ProjectDto } from '../api/types'

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

// A function can also answer LATER (return a promise): that is how a test makes the API slow,
// to see what the app does in the moment between asking and getting the answer.
type Handler = FakeResponse | ((request: FakeRequest) => FakeResponse | Promise<FakeResponse>)

// Answers after a while (for the handlers that return a promise)
export const afterAWhile = <T>(answer: T, milliseconds = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(answer), milliseconds))

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

    const { status, body } = await (typeof handler === 'function' ? handler(request) : handler)
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

// Ready-made API answers, so a test only writes what matters to it
export function organization(overrides: Partial<OrganizationDto> = {}): OrganizationDto {
  return {
    id: 1,
    name: "Ana's space",
    isDemo: false,
    createdAt: '2026-10-01T10:00:00+00:00',
    myRole: 'Owner',
    memberCount: 1,
    projectCount: 0,
    ...overrides,
  }
}

// What GET /api/demo answers: an Owner and two Members of the example organization
export function demoInfo(overrides: Partial<DemoInfoDto> = {}): DemoInfoDto {
  return {
    organizationId: 3,
    organizationName: 'Pink in the Night Studio',
    password: 'Playtest-demo-1',
    accounts: [
      { email: 'luna@demo.test', displayName: 'Luna Park', role: 'Owner' },
      { email: 'theo@demo.test', displayName: 'Theo Vance', role: 'Member' },
      { email: 'iris@demo.test', displayName: 'Iris Okoye', role: 'Member' },
    ],
    ...overrides,
  }
}

export function member(overrides: Partial<MemberDto> = {}): MemberDto {
  return {
    userId: 'user-1',
    displayName: 'Ana',
    email: 'ana@test.local',
    role: 'Member',
    joinedAt: '2026-10-03T10:00:00+00:00',
    ...overrides,
  }
}

export function project(overrides: Partial<ProjectDto> = {}): ProjectDto {
  return {
    id: 1,
    organizationId: 1,
    name: 'Pink in the Night',
    code: 'PIN',
    description: null,
    createdAt: '2026-10-02T10:00:00+00:00',
    bugCount: 0,
    openCriticalCount: 0,
    ...overrides,
  }
}

export function authResponse(token = 'token-for-ana', user = ana) {
  return { token, expiresAt: '2030-01-01T00:00:00+00:00', user }
}
