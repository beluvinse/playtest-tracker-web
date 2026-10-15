import { apiRequest } from './client'
import type {
  AddMemberRequest,
  MemberDto,
  OrganizationDto,
  OrganizationRequest,
  PagedResult,
} from './types'

// Keys TanStack Query uses to cache each response. Invalidating organizationKeys.all
// refetches every organization query on screen (the list, one organization, its members).
export const organizationKeys = {
  all: ['organizations'] as const,
  detail: (id: number) => ['organizations', id] as const,
  members: (id: number) => ['organizations', id, 'members'] as const,
  // One page of the people. It starts with the key above, so invalidating that one refetches
  // every page that is cached.
  membersPage: (id: number, page: number) => ['organizations', id, 'members', { page }] as const,
}

// ---- The organizations ----

// The ones the signed-in person belongs to: their personal one first, the demo last
export function getOrganizations() {
  return apiRequest<OrganizationDto[]>('/api/organizations')
}

// Fails with a 404 ApiError if it doesn't exist or the person isn't a member (the same answer)
export function getOrganization(id: number) {
  return apiRequest<OrganizationDto>(`/api/organizations/${id}`)
}

// Whoever creates an organization is its Owner
export function createOrganization(organization: OrganizationRequest) {
  return apiRequest<OrganizationDto>('/api/organizations', { method: 'POST', body: organization })
}

// Only the Owner (403 for a Member, and for the demo organization)
export function renameOrganization(id: number, organization: OrganizationRequest) {
  return apiRequest<OrganizationDto>(`/api/organizations/${id}`, {
    method: 'PUT',
    body: organization,
  })
}

// Only the Owner (403 otherwise, and for the demo). Fails with a 409 ApiError while the
// organization still has projects.
export function deleteOrganization(id: number) {
  return apiRequest<void>(`/api/organizations/${id}`, { method: 'DELETE' })
}

// ---- Their people ----

// Members per page. The API accepts 1 to 50.
export const membersPageSize = 10

// Any member can see them, one page at a time. The Owner comes first.
export async function getMembers(organizationId: number, page = 1): Promise<PagedResult<MemberDto>> {
  const answer = await apiRequest<PagedResult<MemberDto> | MemberDto[]>(
    `/api/organizations/${organizationId}/members`,
    { query: { page, pageSize: membersPageSize } },
  )

  // Until the API is updated it still answers with the whole list and ignores the page: treat it
  // as a single page, so this screen works with both versions during the deploy
  if (Array.isArray(answer)) {
    return { items: answer, page: 1, pageSize: Math.max(answer.length, 1), totalCount: answer.length }
  }
  return answer
}

// Only the Owner. 404 (with the message on "email") when nobody has an account with that email,
// 409 when that person is already in.
export function addMember(organizationId: number, member: AddMemberRequest) {
  return apiRequest<MemberDto>(`/api/organizations/${organizationId}/members`, {
    method: 'POST',
    body: member,
  })
}

// The Owner removes anybody; anybody can remove themselves (leave). 409 for the Owner.
export function removeMember(organizationId: number, userId: string) {
  return apiRequest<void>(`/api/organizations/${organizationId}/members/${userId}`, {
    method: 'DELETE',
  })
}
