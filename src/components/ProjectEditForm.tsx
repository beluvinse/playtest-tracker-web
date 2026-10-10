import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../api/client'
import { projectKeys, updateProject } from '../api/projects'
import type { ProjectDto, ProjectRequest } from '../api/types'
import { ErrorMessage } from './ErrorMessage'
import { FieldErrors } from './FieldErrors'

interface ProjectEditFormProps {
  project: ProjectDto
  onDone: () => void // back to reading mode (after saving or cancelling)
}

export function ProjectEditForm({ project, onDone }: ProjectEditFormProps) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const queryClient = useQueryClient()

  // Projects only have PUT (no PATCH), so the request always carries every field:
  // the ones you changed and the ones you didn't
  const mutation = useMutation({
    mutationFn: (changes: ProjectRequest) => updateProject(project.id, changes),
    onSuccess: (updated) => {
      queryClient.setQueryData(projectKeys.detail(project.id), updated)
      // The sidebar, the overview and the switcher show the name too
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      onDone()
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const changes = { name: name.trim(), description: description.trim() || null }

    // Nothing changed: skip the request
    if (changes.name === project.name && changes.description === project.description) {
      onDone()
      return
    }

    mutation.mutate(changes)
  }

  const apiError = mutation.error
  const fieldErrors = apiError instanceof ApiError ? apiError.fieldErrors : {}
  const hasFieldErrors = Object.keys(fieldErrors).length > 0

  return (
    <form className="project-form project-edit-form" onSubmit={handleSubmit}>
      <label className="form-field">
        Game name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={100}
          aria-invalid={Boolean(fieldErrors.name)}
          autoFocus
        />
      </label>
      <FieldErrors messages={fieldErrors.name} />

      <label className="form-field">
        <span>
          One-line description <span className="form-optional">optional</span>
        </span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          aria-invalid={Boolean(fieldErrors.description)}
        />
      </label>
      <FieldErrors messages={fieldErrors.description} />

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
