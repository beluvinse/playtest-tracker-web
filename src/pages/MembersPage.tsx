import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { ApiError } from '../api/client'
import { getMembers, getOrganizations, organizationKeys } from '../api/organizations'
import { useAuth } from '../auth/useAuth'
import { ErrorMessage } from '../components/ErrorMessage'
import { OrganizationNotFound } from '../components/OrganizationNotFound'
import { RoleBadge } from '../components/RoleBadge'
import { UserAvatar } from '../components/UserAvatar'
import { formatDate } from '../utils/format'

// The people of one organization: /organizations/:organizationId/members
export function MembersPage() {
  const organizationId = Number(useParams().organizationId)
  const isValidId = Number.isInteger(organizationId) && organizationId > 0
  const { user } = useAuth()

  const { data: members, isPending, error } = useQuery({
    queryKey: organizationKeys.members(organizationId),
    queryFn: () => getMembers(organizationId),
    enabled: isValidId, // don't call the API for URLs like /organizations/abc/members
  })

  // Same key as the sidebar, so this is one request and one cache entry. It only gives the
  // organization's name here.
  const { data: organizations } = useQuery({
    queryKey: organizationKeys.all,
    queryFn: getOrganizations,
  })
  const organization = organizations?.find((candidate) => candidate.id === organizationId)

  // A 404 means it doesn't exist or the person isn't a member: the API says the same for both
  if (!isValidId || (error instanceof ApiError && error.status === 404)) {
    return <OrganizationNotFound />
  }

  if (error) {
    return (
      <div className="page-body">
        <ErrorMessage error={error} />
      </div>
    )
  }

  if (isPending) {
    return <p className="page-body muted">Loading people…</p>
  }

  return (
    <>
      <section className="page-band" aria-label="People in this organization">
        <div className="band-eyebrow">{organization ? organization.name : 'organization'} · people</div>
        <div className="band-title-row">
          <h1 className="band-title">People</h1>
          <span className="band-stats">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>
        <p className="band-description">
          Everybody here can see this organization's projects and bugs, and report and edit them.
        </p>
      </section>

      <ul className="member-rows">
        {members.map((member) => (
          <li key={member.userId} className="member-row">
            <UserAvatar userId={member.userId} size={32} />
            <span className="member-who">
              <span className="member-name">
                {member.displayName}
                {member.userId === user?.id && <span className="member-you">you</span>}
              </span>
              <span className="member-email">{member.email}</span>
            </span>
            <RoleBadge role={member.role} />
            <span className="member-joined">joined {formatDate(member.joinedAt)}</span>
          </li>
        ))}
      </ul>
    </>
  )
}
