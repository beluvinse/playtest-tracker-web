// TypeScript versions of the API's DTOs. Keep them in sync with PlaytestTracker.Api/DTOs.

// The API sends enums as text (JsonStringEnumConverter), so they map to string unions
export type Severity = 'Low' | 'Medium' | 'High' | 'Critical'
export type BugStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed'
export type BugSortField = 'createdAt' | 'severity' | 'status'

export const severities: Severity[] = ['Low', 'Medium', 'High', 'Critical']
export const bugStatuses: BugStatus[] = ['Open', 'InProgress', 'Resolved', 'Closed']

// ---- Responses ----

export interface ProjectDto {
  id: number
  organizationId: number // the organization it belongs to; only its members can see it
  name: string
  code: string // exactly 3 uppercase letters, unique: "PIN"
  description: string | null
  createdAt: string // ISO 8601 with offset, e.g. "2026-10-06T13:12:23+00:00"
  bugCount: number
  // Critical bugs that are not finished yet (Open or InProgress), counted by the API
  openCriticalCount: number
}

export interface BugDto {
  id: number
  projectId: number
  title: string
  description: string
  severity: Severity
  status: BugStatus
  createdAt: string
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}

// ---- Requests ----

export interface ProjectRequest {
  name: string
  code: string // 3 letters; lowercase is fine, the API stores it in uppercase
  description?: string | null
}

export interface CreateBugRequest {
  title: string
  description: string
  severity: Severity
}

export interface UpdateBugRequest extends CreateBugRequest {
  projectId: number
  status: BugStatus
}

// PATCH: every field is optional, and only the ones sent are changed
export type PatchBugRequest = Partial<UpdateBugRequest>

// Query string for GET /api/projects/{projectId}/bugs and GET /api/bugs.
// A type (not an interface) so it can be passed straight to apiRequest as a query.
export type BugListParams = {
  status?: BugStatus
  severity?: Severity
  search?: string
  sortBy?: BugSortField
  descending?: boolean
  page?: number
  pageSize?: number
}

// ---- Authentication ----

// Who a person is, as the API tells it (never anything private)
export interface UserDto {
  id: string
  email: string
  displayName: string
}

// The answer to a successful register or login
export interface AuthResponse {
  token: string // sent back on every request: "Authorization: Bearer <token>"
  expiresAt: string // ISO 8601; after this the token stops working
  user: UserDto
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest extends LoginRequest {
  displayName: string
}

// ---- Organizations ----

// What a person is inside an organization. There is exactly one Owner per organization.
export type OrganizationRole = 'Owner' | 'Member'

// An organization as the signed-in person sees it: what it is, and what THEY are in it
export interface OrganizationDto {
  id: number
  name: string
  // The example organization anybody can look around in: it can't be renamed or deleted,
  // and its people can't change
  isDemo: boolean
  createdAt: string
  myRole: OrganizationRole
  memberCount: number
  projectCount: number
}

// One person in an organization (never anything private, like a password)
export interface MemberDto {
  userId: string
  displayName: string
  email: string
  role: OrganizationRole
  joinedAt: string
}

// POST and PUT /api/organizations
export interface OrganizationRequest {
  name: string
}

// POST /api/organizations/{id}/members: the person must already have an account
export interface AddMemberRequest {
  email: string
}

// ---- The demo ----

export interface DemoAccountDto {
  email: string
  displayName: string
  role: OrganizationRole
}

// GET /api/demo (public, no token): the demo accounts and the password they all share.
// Public on purpose, so the sign-in page can offer them.
export interface DemoInfoDto {
  organizationId: number // the example organization itself: where the demo accounts are taken to
  organizationName: string
  password: string
  accounts: DemoAccountDto[]
}

// ---- Errors ----

// The error format every 4xx response from the API uses (RFC 9457 "problem details")
export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string[]>
}
