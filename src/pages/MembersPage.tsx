import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { ApiError } from '../api/client'
import { getMembers, getOrganizations, organizationKeys } from '../api/organizations'
import { useAuth } from '../auth/useAuth'
import { AddMemberForm } from '../components/AddMemberForm'
import { ErrorMessage } from '../components/ErrorMessage'
import { OrganizationNotFound } from '../components/OrganizationNotFound'
import { RemoveMemberButton } from '../components/RemoveMemberButton'
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

  const ownerName = members.find((member) => member.role === 'Owner')?.displayName

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

      {/* Who can add people: only the Owner, and never in the example organization */}
      {organization?.isDemo ? (
        <p className="member-note">
          This is an example organization: its people are fixed, so nobody can be added or removed.
        </p>
      ) : organization?.myRole === 'Owner' ? (
        <AddMemberForm organizationId={organizationId} />
      ) : organization ? (
        <p className="member-note">
          Only the owner{ownerName ? ` (${ownerName})` : ''} can add people to this organization.
        </p>
      ) : null}

      <ul className="member-rows">
        {members.map((member) => {
          const isMe = member.userId === user?.id

          // Who can take whom out: the Owner removes any Member, and anybody can leave on their
          // own. The Owner can't go (an organization always has its owner), and in the example
          // organization nobody can.
          const canRemove =
            organization !== undefined &&
            !organization.isDemo &&
            member.role !== 'Owner' &&
            (organization.myRole === 'Owner' || isMe)

          return (
            <li key={member.userId} className="member-row">
              <UserAvatar userId={member.userId} size={32} />
              <span className="member-who">
                <span className="member-name">
                  {member.displayName}
                  {isMe && <span className="member-you">you</span>}
                </span>
                <span className="member-email">{member.email}</span>
              </span>
              <RoleBadge role={member.role} />
              <span className="member-joined">joined {formatDate(member.joinedAt)}</span>
              <span className="member-actions">
                {canRemove && <RemoveMemberButton organization={organization} member={member} isMe={isMe} />}
              </span>
            </li>
          )
        })}
      </ul>
    </>
  )
}
