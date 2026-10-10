import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { useNavigate } from 'react-router'
import { bugKeys, deleteBug } from '../api/bugs'
import { projectKeys } from '../api/projects'
import { ErrorMessage } from './ErrorMessage'

interface DeleteBugButtonProps {
  bugId: number
  bugCode: string // "PIN-017", to name it in the question
  projectId: number // where to go once it's gone
}

// "Delete" opens a confirmation dialog; only its second button deletes.
// <dialog> with showModal() is the browser's own modal: it blocks the page behind it,
// keeps keyboard focus inside, and closes with Escape.
export function DeleteBugButton({ bugId, bugCode, projectId }: DeleteBugButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => deleteBug(bugId),
    onSuccess: () => {
      // Leave first: this page would otherwise refetch the bug and get a 404.
      // replace: Back shouldn't return to a bug that no longer exists.
      navigate(`/projects/${projectId}`, { replace: true })
      queryClient.removeQueries({ queryKey: bugKeys.detail(bugId) })
      queryClient.invalidateQueries({ queryKey: bugKeys.all })
      queryClient.invalidateQueries({ queryKey: projectKeys.all }) // bugCount went down
    },
  })

  return (
    <>
      <button
        type="button"
        className="button-ghost button-danger"
        onClick={() => dialogRef.current?.showModal()}
      >
        Delete
      </button>

      <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby="delete-title">
        <h2 id="delete-title" className="confirm-title">
          Delete {bugCode}?
        </h2>
        <p className="confirm-text">This can't be undone. The bug will be gone for everyone.</p>
        {mutation.error && <ErrorMessage error={mutation.error} />}
        <div className="form-actions">
          {/* autoFocus on Cancel: pressing Enter right away keeps the bug */}
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
            {mutation.isPending ? 'Deleting…' : 'Delete bug'}
          </button>
        </div>
      </dialog>
    </>
  )
}
