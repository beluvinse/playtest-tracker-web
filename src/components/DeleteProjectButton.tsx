import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { bugKeys, deleteProjectBugs } from '../api/bugs'
import { ApiError } from '../api/client'
import { organizationKeys } from '../api/organizations'
import { deleteProject, projectKeys } from '../api/projects'
import type { ProjectDto } from '../api/types'
import { ErrorMessage } from './ErrorMessage'

// "Delete" opens a confirmation dialog. An empty project is deleted after a simple confirm.
// A project with bugs can be deleted together with them, but only after typing its name:
// it deletes a lot at once and can't be undone, so one stray click must not be enough.
export function DeleteProjectButton({ project }: { project: ProjectDto }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [typedName, setTypedName] = useState('')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const bugCount = project.bugCount
  const hasBugs = bugCount > 0
  const bugsText = `${bugCount} ${bugCount === 1 ? 'bug' : 'bugs'}`

  const mutation = useMutation({
    // Two requests when there are bugs: first empty the project, then delete it
    // (the API refuses to delete a project that still has bugs)
    mutationFn: async (withBugs: boolean) => {
      if (withBugs) await deleteProjectBugs(project.id)
      await deleteProject(project.id)
    },
    onSuccess: () => {
      // Leave first (this page would refetch the project and get a 404), then clean the cache
      navigate(`/organizations/${project.organizationId}`, { replace: true })
      queryClient.removeQueries({ queryKey: projectKeys.detail(project.id) })
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      queryClient.invalidateQueries({ queryKey: organizationKeys.all }) // its project count changed
      queryClient.invalidateQueries({ queryKey: bugKeys.all }) // lists and counts
    },
    onError: (error, withBugs) => {
      // Our copy may be out of date. Two ways that happens:
      // - 409: someone reported a bug that we didn't know about
      // - the bugs were deleted but deleting the project failed (a new bug slipped in
      //   between the two requests): the bugs are gone, the project is still here
      // Refetching shows the real state, and the dialog updates by itself.
      if (withBugs || (error instanceof ApiError && error.status === 409)) {
        queryClient.invalidateQueries({ queryKey: projectKeys.all })
        queryClient.invalidateQueries({ queryKey: bugKeys.all })
      }
    },
  })

  function close() {
    dialogRef.current?.close()
  }

  // Runs on every close (button, Escape): the next time, the dialog starts clean
  function handleClose() {
    mutation.reset()
    setTypedName('')
  }

  const nameMatches = typedName.trim() === project.name

  return (
    <>
      <button
        type="button"
        className="button-ghost button-danger"
        onClick={() => dialogRef.current?.showModal()}
      >
        Delete
      </button>

      <dialog
        ref={dialogRef}
        className="confirm-dialog"
        aria-labelledby="delete-project-title"
        onClose={handleClose}
      >
        {hasBugs ? (
          <>
            <h2 id="delete-project-title" className="confirm-title">
              Delete {project.name} and its {bugsText}?
            </h2>
            <p className="confirm-text">
              This deletes the project <strong>and every one of its {bugsText}</strong>. It can't
              be undone.
            </p>
            <label className="form-field confirm-field">
              <span>
                Type <strong className="confirm-name">{project.name}</strong> to confirm
              </span>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                // Focus starts here, ready to type. Enter does nothing in this field,
                // so a reflex Enter can't delete anything.
                autoFocus
              />
            </label>
            {mutation.error && <ErrorMessage error={mutation.error} />}
            <div className="form-actions">
              <button type="button" className="button-ghost" onClick={close}>
                Cancel
              </button>
              <button
                type="button"
                className="button-primary button-small"
                data-tone="danger"
                disabled={!nameMatches || mutation.isPending}
                onClick={() => mutation.mutate(true)}
              >
                {mutation.isPending ? 'Deleting…' : `Delete project and ${bugsText}`}
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
                onClick={() => mutation.mutate(false)}
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
