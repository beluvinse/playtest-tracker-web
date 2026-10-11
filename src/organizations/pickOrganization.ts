import type { OrganizationDto } from '../api/types'

// Which organization to open when the person arrives without one in the address: the last one
// they used, if they still belong to it, and otherwise the first. The API lists their personal
// organization first and the demo last, so "the first" is their own.
export function pickOrganization(
  organizations: OrganizationDto[],
  lastUsedId: number | null,
): OrganizationDto | undefined {
  return organizations.find((organization) => organization.id === lastUsedId) ?? organizations[0]
}

// Which organization the app is "in" right now, from where the person is:
//  - an address with an organization in it ("/organizations/3/…") says it itself
//  - inside a project or a bug, it is the organization that project belongs to (undefined
//    while the project is still loading: better to show nothing than the wrong organization)
//  - anywhere else, the last one they used
export function resolveOrganizationId(where: {
  fromAddress: number | undefined
  insideAProject: boolean
  ofTheProject: number | undefined
  lastUsed: number | null
}): number | undefined {
  if (where.fromAddress !== undefined) return where.fromAddress
  if (where.insideAProject) return where.ofTheProject
  return where.lastUsed ?? undefined
}
