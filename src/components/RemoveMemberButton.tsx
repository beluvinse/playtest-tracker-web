import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { useNavigate } from 'react-router'
import { organizationKeys, removeMember } from '../api/organizations'
import type { MemberDto, OrganizationDto } from '../api/types'
import { ErrorMessage } from './ErrorMessage'

interface RemoveMemberButtonProps {
  organization: OrganizationDto
  member: MemberDto // the row this button belongs to
  isMe: boolean // the row is the person looking: "Leave" instead of "Remove"
}

// "Remove" (the Owner taking someone out) or "Leave" (a Member going away on their own).
// Both open a confirmation dialog, and only its second button does it. Same as the deletes:
// <dialog> with showModal() is the browser's own modal.
export function RemoveMemberButton({ organization, member, isMe }: RemoveMemberButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => removeMember(organization.id, member.userId),
    onSuccess: () => {
      dialogRef.current?.close()

      if (isMe) {
        // The organization is no longer theirs. Leave first: this page would otherwise refetch
        // its people and get a 404. "/" finds another organization to open.
        navigate('/', { replace: true })

        // Only the list of their organizations changes (this one is gone from it). Asking for
        // everything about organizations would make the page that is still on screen ask for
        // the people of the organization they just left, which is a 404. What stays in the cache
        // about it is not cleaned up either: removing it while the page is still there makes
        // the page ask for it again. It is out of date by the time it could be seen again, and
        // it is refreshed on arrival anyway.
        queryClient.invalidateQueries({ queryKey: organizationKeys.all, exact: true })
        return
      }

      // The list of people, the counts in the sidebar and the organization switcher
      queryClient.invalidateQueries({ queryKey: organizationKeys.all })
    },
  })

  const titleId = `remove-${member.userId}-title`
  const verb = isMe ? 'Leave' : 'Remove'

  return (
    <>
      <button
        type="button"
        className="button-ghost button-danger"
        aria-label={isMe ? `Leave ${organization.name}` : `Remove ${member.displayName}`}
        onClick={() => dialogRef.current?.showModal()}
      >
        {verb}
      </button>

      <dialog
        ref={dialogRef}
        className="confirm-dialog"
        aria-labelledby={titleId}
        onClose={() => mutation.reset()} // the next time it opens, it starts clean
      >
        <h2 id={titleId} className="confirm-title">
          {isMe ? `Leave ${organization.name}?` : `Remove ${member.displayName}?`}
        </h2>
        <p className="confirm-text">
          {isMe
            ? "You will lose access to its projects and bugs. The owner can add you back."
            : `${member.displayName} will lose access to this organization's projects and bugs. You can add them back later.`}
        </p>
        {mutation.error && <ErrorMessage error={mutation.error} />}
        <div className="form-actions">
          {/* autoFocus on Cancel: pressing Enter right away changes nothing */}
          <button
            type="button"
            className="button-ghost"
            autoFocus
            onClick={() => dialogRef.current?.close()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button-primary button-small"
            data-tone="danger"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? `${isMe ? 'Leaving' : 'Removing'}…` : `Yes, ${verb.toLowerCase()}`}
          </button>
        </div>
      </dialog>
    </>
  )
}
