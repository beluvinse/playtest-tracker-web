import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { createProject, projectKeys } from '../api/projects'
import { BugArt } from '../components/BugArt'
import { ErrorMessage } from '../components/ErrorMessage'
import { CodeInput } from '../components/CodeInput'
import { FieldErrors } from '../components/FieldErrors'
import { bugCode, suggestCode } from '../utils/projectCode'

// Same limits as ProjectRequestDto in the API. The browser checks them first (instant feedback);
// the API checks them again, because anyone can call it without this form.
const nameMinLength = 2
const nameMaxLength = 100
const descriptionMaxLength = 1000

interface NewProjectPageProps {
  firstRun?: boolean // no projects yet: show the "Press start" welcome
}

export function NewProjectPage({ firstRun = false }: NewProjectPageProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  // The code follows the name ("Pink…" → "PIN") until the person types in the Code field;
  // from then on it's theirs, and changing the name doesn't overwrite it
  const [typedCode, setTypedCode] = useState<string | null>(null)
  const code = typedCode ?? (name.trim() ? suggestCode(name) : '')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // useQuery reads data; useMutation changes it (POST, PUT, PATCH, DELETE).
  // It gives us isPending and error for the request, like useQuery does.
  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      // The cached project list is now out of date: mark it stale so it refetches
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      navigate(`/projects/${project.id}`)
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate({
      name: name.trim(),
      code,
      description: description.trim() || null, // empty means "no description", not ""
    })
  }

  // Errors the API attached to a field (400 validation) go under that field;
  // anything else (API down, 500…) goes in a box above the button
  const apiError = mutation.error
  const fieldErrors = apiError instanceof ApiError ? apiError.fieldErrors : {}
  const hasFieldErrors = Object.keys(fieldErrors).length > 0

  return (
    <div className="new-project">
      <section className="new-project-main page-band">
        <div className="press-start">
          <BugArt />
          <div>
            <h1 className="press-start-title">
              {firstRun ? 'Press start' : 'New project'}
              <span className="blink" aria-hidden="true">
                _
              </span>
            </h1>
            <p className="press-start-text">
              {firstRun
                ? "Every bug lives inside a project. Make one for the game you're testing."
                : 'One project per game. Its bugs, filters and counts stay separate from the rest.'}
            </p>
          </div>
        </div>

        <form className="project-form" onSubmit={handleSubmit}>
          {/* Name and code side by side, like in the design */}
          <div className="form-row">
            <label className="form-field">
              Game name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={nameMinLength}
                maxLength={nameMaxLength}
                placeholder="Pink in the Night"
                aria-invalid={Boolean(fieldErrors.name)}
                autoFocus
              />
            </label>
            <CodeInput value={code} onChange={setTypedCode} invalid={Boolean(fieldErrors.code)} />
          </div>
          <FieldErrors messages={fieldErrors.name} />
          <FieldErrors messages={fieldErrors.code} />
          <p id="code-hint" className="form-hint">
            bug ids will look like{' '}
            <span className="form-hint-code">{bugCode(code || 'PIN', 1)}</span> · 3 letters,
            picked from the name, and you can change them
          </p>

          <label className="form-field">
            <span>
              One-line description <span className="form-optional">optional</span>
            </span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={descriptionMaxLength}
              placeholder="Seated VR experience"
              aria-invalid={Boolean(fieldErrors.description)}
            />
          </label>
          <FieldErrors messages={fieldErrors.description} />

          {apiError && !hasFieldErrors && <ErrorMessage error={apiError} />}

          <div className="form-actions">
            <button type="submit" className="button-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create project'}
            </button>
            <span className="form-hint">enter ↵</span>
          </div>
        </form>
      </section>

      <aside className="new-project-steps" aria-label="What happens next">
        <div className="eyebrow">Setup · 0 of 3</div>
        <ol>
          <li data-current="true">
            <span className="step-number">01</span>
            <span>
              <strong>Create the project</strong>
              <span>A name and a short description. You're here.</span>
            </span>
          </li>
          <li>
            <span className="step-number">02</span>
            <span>
              <strong>Log the bugs</strong>
              <span>Each one gets an id, a severity and a status.</span>
            </span>
          </li>
          <li>
            <span className="step-number">03</span>
            <span>
              <strong>Triage</strong>
              <span>Filter by status and severity to see what blocks the next build.</span>
            </span>
          </li>
        </ol>
        <div className="scanline" aria-hidden="true" />
        <p className="steps-note">
          Working on several games? Each one gets its own project; an all-projects overview
          appears once you have two.
        </p>
      </aside>
    </div>
  )
}
