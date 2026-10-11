import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router'
import { getOrganizations, organizationKeys } from '../api/organizations'
import { ErrorMessage } from '../components/ErrorMessage'
import { getLastOrganizationId } from '../organizations/lastOrganization'
import { pickOrganization } from '../organizations/pickOrganization'

// "/": there is nothing to show here by itself, it sends the person to one of their organizations
export function HomePage() {
  const { data: organizations, isPending, error } = useQuery({
    queryKey: organizationKeys.all,
    queryFn: getOrganizations,
  })

  if (isPending) {
    return <p className="page-body muted">Loading your organizations…</p>
  }

  if (error) {
    return (
      <div className="page-body">
        <ErrorMessage error={error} />
      </div>
    )
  }

  const organization = pickOrganization(organizations, getLastOrganizationId())

  // Possible if they deleted every organization they had
  if (!organization) {
    return (
      <section className="page-body">
        <h2>No organization yet</h2>
        <p className="muted">
          Every project lives inside an organization, and you don't belong to any right now.
        </p>
      </section>
    )
  }

  // replace: the Back button skips this redirect instead of bouncing back into it
  return <Navigate to={`/organizations/${organization.id}`} replace />
}
