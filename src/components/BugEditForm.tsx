import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { bugKeys, patchBug } from '../api/bugs'
import { ApiError } from '../api/client'
import { projectKeys } from '../api/projects'
import type { BugDto, PatchBugRequest, Severity } from '../api/types'
import { ErrorMessage } from './ErrorMessage'
import { FieldErrors } from './FieldErrors'
import { SeverityPicker } from './SeverityPicker'

interface BugEditFormProps {
  bug: BugDto
  onDone: () => void // back to reading mode (after saving or cancelling)
}

// Edits title, description and severity. Status has its own menu.
export function BugEditForm({ bug, onDone }: BugEditFormProps) {
  // The form starts with the bug's current values
  const [title, setTitle] = useState(bug.title)
  const [description, setDescription] = useState(bug.description)
  const [severity, setSeverity] = useState<Severity>(bug.severity)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (changes: PatchBugRequest) => patchBug(bug.id, changes),
    onSuccess: (updated) => {
      queryClient.setQueryData(bugKeys.detail(bug.id), updated)
      queryClient.invalidateQueries({ queryKey: bugKeys.all })
      // A severity change can add or remove a critical bug: the projects carry that count
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      onDone()
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    // PATCH only what changed. If someone else edited another field meanwhile,
    // we don't overwrite it with the old value we had on screen (a PUT would).
    const changes: PatchBugRequest = {}
    if (title.trim() !== bug.title) changes.title = title.trim()
    if (description.trim() !== bug.description) changes.description = description.trim()
    if (severity !== bug.severity) changes.severity = severity

    // Nothing changed: no request (the API would answer 400 to an empty PATCH anyway)
    if (Object.keys(changes).length === 0) {
      onDone()
      return
    }

    mutation.mutate(changes)
  }

  const apiError = mutation.error
  const fieldErrors = apiError instanceof ApiError ? apiError.fieldErrors : {}
  const hasFieldErrors = Object.keys(fieldErrors).length > 0

  return (
    <form className="project-form bug-edit-form" onSubmit={handleSubmit}>
      <label className="form-field">
        Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={200}
          aria-invalid={Boolean(fieldErrors.title)}
          autoFocus
        />
      </label>
      <FieldErrors messages={fieldErrors.title} />

      <label className="form-field">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          aria-invalid={Boolean(fieldErrors.description)}
        />
      </label>
      <FieldErrors messages={fieldErrors.description} />

      <SeverityPicker value={severity} onChange={setSeverity} />
      <FieldErrors messages={fieldErrors.severity} />

      {apiError && !hasFieldErrors && <ErrorMessage error={apiError} />}

      <div className="form-actions">
        <button type="submit" className="button-primary button-small" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" className="button-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}
