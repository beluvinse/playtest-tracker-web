import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { bugKeys, patchBug } from '../api/bugs'
import { bugStatuses } from '../api/types'
import type { BugDto, BugStatus } from '../api/types'
import { useDismiss } from '../hooks/useDismiss'
import { StatusLabel } from './BugBadges'
import { ErrorMessage } from './ErrorMessage'
import { PixelIcon } from './PixelIcon'

// The bug's status, as a button that opens a list of statuses to choose from.
// Nothing changes until an option is picked, so a stray click can't close a bug.
export function BugStatusControls({ bug }: { bug: BugDto }) {
  const queryClient = useQueryClient()
  const detailsRef = useRef<HTMLDetailsElement>(null)
  useDismiss(detailsRef)

  // PATCH sends only what changes: { "status": "Resolved" }. A PUT would need every field.
  const mutation = useMutation({
    mutationFn: (status: BugStatus) => patchBug(bug.id, { status }),
    onSuccess: (updated) => {
      // The API answers with the updated bug, so this page can show it right away…
      queryClient.setQueryData(bugKeys.detail(bug.id), updated)
      // …and every list and count that may include it gets refetched in the background
      queryClient.invalidateQueries({ queryKey: bugKeys.all })
    },
  })

  function choose(status: BugStatus) {
    if (detailsRef.current) detailsRef.current.open = false
    if (status !== bug.status) mutation.mutate(status)
  }

  return (
    <div className="status-menu-wrap">
      <details className="status-menu" ref={detailsRef}>
        <summary className="status-menu-button" aria-disabled={mutation.isPending}>
          <span className="visually-hidden">Status: </span>
          <StatusLabel status={bug.status} />
          {mutation.isPending ? (
            <span className="status-saving">saving…</span>
          ) : (
            <PixelIcon name="chevronDown" size={8} className="status-chevron" />
          )}
        </summary>

        <div className="status-menu-list">
          <div className="eyebrow status-menu-heading">Change status</div>
          {bugStatuses.map((status) => (
            <button
              key={status}
              type="button"
              className="status-option"
              aria-pressed={status === bug.status}
              disabled={mutation.isPending}
              onClick={() => choose(status)}
            >
              <StatusLabel status={status} />
              {status === bug.status && (
                <PixelIcon name="check" size={10} className="switcher-check" />
              )}
            </button>
          ))}
        </div>
      </details>

      {mutation.error && (
        <div className="status-error">
          <ErrorMessage error={mutation.error} />
        </div>
      )}
    </div>
  )
}
