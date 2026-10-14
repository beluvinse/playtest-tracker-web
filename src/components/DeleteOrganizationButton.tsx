import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { useNavigate } from 'react-router'
import { deleteOrganization, organizationKeys } from '../api/organizations'
import type { OrganizationDto } from '../api/types'
import { ErrorMessage } from './ErrorMessage'

interface DeleteOrganizationButtonProps {
  organization: OrganizationDto
  isOnlyOne: boolean // the only organization the person has: they are told what that means
}

// "Delete organization" opens a confirmation dialog; only its second button deletes.
// The API doesn't delete an organization that still has projects (409): so while it has some
// the button waits, and says why. (If a project appears in between, the API's answer is shown.)
export function DeleteOrganizationButton({ organization, isOnlyOne }: DeleteOrganizationButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => deleteOrganization(organization.id),
    onSuccess: () => {
      dialogRef.current?.close()

      // Take it out of the list we hold BEFORE leaving. "/" picks where to go from that list, and
      // until the refreshed one arrives it would still be there: it would send the person right
      // back to the organization they just deleted.
      queryClient.setQueryData<OrganizationDto[]>(organizationKeys.all, (organizations) =>
        organizations?.filter((candidate) => candidate.id !== organization.id),
      )

      // Leave: this page would otherwise ask the API about an organization that no longer
      // exists. "/" opens another organization of theirs, if they have one.
      // replace: Back shouldn't return to an organization that is gone.
      navigate('/', { replace: true })

      // Only the list of their organizations changes (this one is gone from it). What stays in
      // the cache about the deleted one is left alone: removing it while its page is still on
      // screen makes the page ask for it again (a 404).
      queryClient.invalidateQueries({ queryKey: organizationKeys.all, exact: true })
    },
  })

  const hasProjects = organization.projectCount > 0
  const hintId = 'delete-organization-hint'

  return (
    <>
      <button
        type="button"
        className="button-ghost button-danger"
        disabled={hasProjects}
        aria-describedby={hasProjects ? hintId : undefined}
        onClick={() => dialogRef.current?.showModal()}
      >
        Delete organization
      </button>
      {hasProjects && (
        <p id={hintId} className="form-hint">
          It still has {organization.projectCount}{' '}
          {organization.projectCount === 1 ? 'project' : 'projects'}. Delete{' '}
          {organization.projectCount === 1 ? 'it' : 'them'} first.
        </p>
      )}

      <dialog
        ref={dialogRef}
        className="confirm-dialog"
        aria-labelledby="delete-organization-title"
        onClose={() => mutation.reset()} // the next time it opens, it starts clean
      >
        <h2 id="delete-organization-title" className="confirm-title">
          Delete {organization.name}?
        </h2>
        <p className="confirm-text">
          This can't be undone. Its {organization.memberCount === 1 ? 'only member' : 'members'} will
          lose access to it.
          {isOnlyOne && ' It is your only organization: you will need to create another one to keep working.'}
        </p>
        {mutation.error && <ErrorMessage error={mutation.error} />}
        <div className="form-actions">
          {/* autoFocus on Cancel: pressing Enter right away keeps the organization */}
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
            {mutation.isPending ? 'Deleting…' : 'Yes, delete'}
          </button>
        </div>
      </dialog>
    </>
  )
}
