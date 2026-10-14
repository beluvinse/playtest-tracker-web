import { useQuery } from '@tanstack/react-query'
import { getOrganizations, organizationKeys } from '../api/organizations'
import type { OrganizationRole } from '../api/types'

// What the signed-in person is in an organization: 'Owner', 'Member', or undefined while it
// loads (and when the organization isn't one of theirs). It reads the list of their organizations,
// the same cache entry the sidebar uses, so it costs no extra request.
//
// It is for deciding what to OFFER (a button that would only get a 403 is better not shown).
// The API is what really refuses: this never replaces it.
export function useOrganizationRole(organizationId: number): OrganizationRole | undefined {
  const { data: organizations } = useQuery({
    queryKey: organizationKeys.all,
    queryFn: getOrganizations,
  })

  return organizations?.find((organization) => organization.id === organizationId)?.myRole
}
