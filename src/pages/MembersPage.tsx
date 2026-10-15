import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router'
import { ApiError } from '../api/client'
import { getMembers, getOrganizations, organizationKeys } from '../api/organizations'
import { useAuth } from '../auth/useAuth'
import { AddMemberForm } from '../components/AddMemberForm'
import { ErrorMessage } from '../components/ErrorMessage'
import { OrganizationNotFound } from '../components/OrganizationNotFound'
import { Pagination } from '../components/Pagination'
import { RemoveMemberButton } from '../components/RemoveMemberButton'
import { RoleBadge } from '../components/RoleBadge'
import { UserAvatar } from '../components/UserAvatar'
import { formatDate } from '../utils/format'

// The people of one organization: /organizations/:organizationId/members
export function MembersPage() {
  const organizationId = Number(useParams().organizationId)
  const isValidId = Number.isInteger(organizationId) && organizationId > 0
  const { user } = useAuth()

  // The page lives in the address (?page=2), so a reload or a shared link shows the same people
  const [searchParams, setSearchParams] = useSearchParams()
  const page = toPageNumber(searchParams.get('page'))

  const { data, isPending, error } = useQuery({
    queryKey: organizationKeys.membersPage(organizationId, page),
    queryFn: () => getMembers(organizationId, page),
    enabled: isValidId, // don't call the API for URLs like /organizations/abc/members
    // While another page loads, keep showing the one on screen instead of "Loading…"
    placeholderData: keepPreviousData,
  })

  function goToPage(next: number) {
    setSearchParams((current) => {
      const params = new URLSearchParams(current)
      if (next <= 1) {
        params.delete('page')
      } else {
        params.set('page', String(next))
      }
      return params
    })
  }

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

  const members = data.items
  const ownerName = members.find((member) => member.role === 'Owner')?.displayName

  return (
    <>
      <section className="page-band" aria-label="People in this organization">
        <div className="band-eyebrow">{organization ? organization.name : 'organization'} · people</div>
        <div className="band-title-row">
          <h1 className="band-title">People</h1>
          <span className="band-stats">
            {data.totalCount} {data.totalCount === 1 ? 'member' : 'members'}
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

      {/* A page past the end (an old link, or the last person of the last page just left) */}
      {members.length === 0 && data.totalCount > 0 && (
        <p className="list-message">
          This page is empty.{' '}
          <button type="button" className="link-button" onClick={() => goToPage(1)}>
            Go to the first page
          </button>
        </p>
      )}

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

      {data.totalCount > data.pageSize && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          totalCount={data.totalCount}
          onPageChange={goToPage}
          label="People pages"
        />
      )}
    </>
  )
}

// ?page=3 → 3. Missing or invalid values (?page=abc, ?page=-1) mean page 1.
function toPageNumber(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}
