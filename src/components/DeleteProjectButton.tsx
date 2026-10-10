import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { useNavigate } from 'react-router'
import { bugKeys } from '../api/bugs'
import { ApiError } from '../api/client'
import { deleteProject, projectKeys } from '../api/projects'
import type { ProjectDto } from '../api/types'
import { ErrorMessage } from './ErrorMessage'

// "Delete" opens a confirmation dialog. The API refuses to delete a project that still
// has bugs (409 Conflict), so in that case the dialog explains why instead of offering it.
export function DeleteProjectButton({ project }: { project: ProjectDto }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const hasBugs = project.bugCount > 0

  const mutation = useMutation({
    mutationFn: () => deleteProject(project.id),
    onSuccess: () => {
      // Leave first (this page would refetch the project and get a 404), then clean the cache
      navigate('/', { replace: true })
      queryClient.removeQueries({ queryKey: projectKeys.detail(project.id) })
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      queryClient.invalidateQueries({ queryKey: bugKeys.all }) // studio-wide counts
    },
    onError: (error) => {
      // 409: the project has bugs we didn't know about (someone reported one meanwhile),
      // so our copy is out of date. Refetching updates bugCount, and the dialog switches
      // to the "still has bugs" message by itself.
      if (error instanceof ApiError && error.status === 409) {
        queryClient.invalidateQueries({ queryKey: projectKeys.all })
        queryClient.invalidateQueries({ queryKey: bugKeys.all })
      }
    },
  })

  function close() {
    dialogRef.current?.close()
    mutation.reset() // forget an old error, so reopening starts clean
  }

  return (
    <>
      <button
        type="button"
        className="button-ghost button-danger"
        onClick={() => dialogRef.current?.showModal()}
      >
        Delete
      </button>

      {/* onClose also runs when Escape closes the dialog */}
      <dialog
        ref={dialogRef}
        className="confirm-dialog"
        aria-labelledby="delete-project-title"
        onClose={() => mutation.reset()}
      >
        {hasBugs ? (
          <>
            <h2 id="delete-project-title" className="confirm-title">
              {project.name} still has bugs
            </h2>
            <p className="confirm-text">
              A project can only be deleted when it's empty. Delete its {project.bugCount}{' '}
              {project.bugCount === 1 ? 'bug' : 'bugs'} first.
            </p>
            <div className="form-actions">
              <button type="button" className="button-ghost" autoFocus onClick={close}>
                OK
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="delete-project-title" className="confirm-title">
              Delete {project.name}?
            </h2>
            <p className="confirm-text">This can't be undone.</p>
            {/* e.g. a 409 if someone reported a bug while this dialog was open */}
            {mutation.error && <ErrorMessage error={mutation.error} />}
            <div className="form-actions">
              {/* autoFocus on Cancel: pressing Enter right away keeps the project */}
              <button type="button" className="button-ghost" autoFocus onClick={close}>
                Cancel
              </button>
              <button
                type="button"
                className="button-primary button-small"
                data-tone="danger"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? 'Deleting…' : 'Delete project'}
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  )
}
