import { clearToken, getToken } from '../auth/tokenStorage'
import type { ProblemDetails } from './types'

const apiUrl = import.meta.env.VITE_API_URL

// Called when the API stops accepting our token (it expired, or the account is gone).
// The auth provider sets it, so this file doesn't need to know about React.
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

// Thrown for any response that is not 2xx, so screens can show what went wrong
export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetails | null

  constructor(status: number, problem: ProblemDetails | null) {
    super(problem?.detail ?? problem?.title ?? `Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }

  // Validation errors by field, with the API's PascalCase names turned into camelCase
  // ("Title" → "title") so they match the request bodies. Object-level errors use the key "".
  get fieldErrors(): Record<string, string[]> {
    const errors = this.problem?.errors ?? {}
    return Object.fromEntries(
      Object.entries(errors).map(([field, messages]) => [
        field.charAt(0).toLowerCase() + field.slice(1),
        messages,
      ]),
    )
  }
}

type Query = Record<string, string | number | boolean | undefined>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Query
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  // Every request carries the token when there is one: that is how the API knows who is asking
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${apiUrl}${path}${toQueryString(query)}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  // A 401 for a request that carried a token means the token is no longer good, so the session
  // is over. (A 401 without a token is just a failed login, and is the caller's to show.)
  // The check against getToken() skips a late 401 that belongs to an OLD token, when the person
  // has already logged in again with a new one.
  if (response.status === 401 && token && getToken() === token) {
    clearToken()
    onUnauthorized?.()
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readProblem(response))
  }

  // 204 No Content (for example, a DELETE) has no body to parse
  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

// Leaves out empty values, so { status: undefined, page: 2 } becomes "?page=2"
function toQueryString(query: Query | undefined): string {
  if (!query) return ''

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  }

  const text = params.toString()
  return text ? `?${text}` : ''
}

async function readProblem(response: Response): Promise<ProblemDetails | null> {
  try {
    return (await response.json()) as ProblemDetails
  } catch {
    // Some errors (like a 405) come without a JSON body
    return null
  }
}
