import { apiRequest } from './client'
import type {
  AddMemberRequest,
  MemberDto,
  OrganizationDto,
  OrganizationRequest,
} from './types'

// Keys TanStack Query uses to cache each response. Invalidating organizationKeys.all
// refetches every organization query on screen (the list, one organization, its members).
export const organizationKeys = {
  all: ['organizations'] as const,
  detail: (id: number) => ['organizations', id] as const,
  members: (id: number) => ['organizations', id, 'members'] as const,
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

// Any member can see them. The Owner comes first.
export function getMembers(organizationId: number) {
  return apiRequest<MemberDto[]>(`/api/organizations/${organizationId}/members`)
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
